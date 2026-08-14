"use client";

import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { supabase } from "@/lib/supabase/client";
import { taskSelect, taskTemplateSelect, rewardTxSelect } from "@/features/workspace/useWorkspace";
import type { Member, RewardTransaction, Task, TaskTemplate, Workspace } from "@/types/app";

export type RepeatType = "none" | "daily" | "weekly";

type UseTasksParams = {
  workspace: Workspace | null;
  isManager: boolean;
  currentMember: Member | null;
  members: Member[];
  selectedDate: string;
  setTasks: Dispatch<SetStateAction<Task[]>>;
  setTemplates: Dispatch<SetStateAction<TaskTemplate[]>>;
  setRewardTransactions: Dispatch<SetStateAction<RewardTransaction[]>>;
  loadWorkspaceData: (workspaceId: string) => Promise<void>;
  setMessage: (message: string) => void;
  setLoading: (loading: boolean) => void;
};

export function useTasks({
  workspace,
  isManager,
  currentMember,
  members,
  selectedDate,
  setTasks,
  setTemplates,
  setRewardTransactions,
  loadWorkspaceData,
  setMessage,
  setLoading,
}: UseTasksParams) {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskAssignedMemberId, setNewTaskAssignedMemberId] = useState("");
  const [newTaskVerificationType, setNewTaskVerificationType] = useState("none");
  const [newTaskDueTime, setNewTaskDueTime] = useState("");
  const [newTaskRewardPoints, setNewTaskRewardPoints] = useState(1);
  const [newTaskRepeatType, setNewTaskRepeatType] = useState<RepeatType>("none");
  const [newTaskRepeatWeekdays, setNewTaskRepeatWeekdays] = useState<number[]>([]);

  function resetTaskState() {
    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskAssignedMemberId("");
    setNewTaskVerificationType("none");
    setNewTaskRewardPoints(1);
    setNewTaskRepeatType("none");
    setNewTaskRepeatWeekdays([]);
    setNewTaskDueTime("");
  }

  function toggleRepeatWeekday(day: number) {
    setNewTaskRepeatWeekdays((prev) =>
      prev.includes(day) ? prev.filter((item) => item !== day) : [...prev, day].sort((a, b) => a - b)
    );
  }

  async function createTask() {
    if (!workspace) {
      setMessage("모임이 없습니다.");
      return;
    }
    if (!newTaskTitle.trim()) {
      setMessage("제목을 입력해주세요.");
      return;
    }
    if (!newTaskAssignedMemberId) {
      setMessage("담당자를 선택해주세요.");
      return;
    }
    if (newTaskRepeatType === "weekly" && newTaskRepeatWeekdays.length === 0) {
      setMessage("반복할 요일을 선택해주세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    const creatorMemberId =
      currentMember?.id ||
      members.find((member) => member.role === "owner" || member.role === "manager")?.id ||
      null;

    if (newTaskRepeatType === "none") {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          workspace_id: workspace.id,
          title: newTaskTitle.trim(),
          description: newTaskDescription.trim() || null,
          task_type: "custom",
          status: "todo",
          due_date: selectedDate,
          assigned_member_id: newTaskAssignedMemberId,
          verification_type: newTaskVerificationType,
          due_time: newTaskDueTime || null,
          verification_required: newTaskVerificationType !== "none",
          reward_points: newTaskRewardPoints,
          rollover_enabled: true,
          created_by_member_id: creatorMemberId,
        })
        .select(taskSelect)
        .single();

      if (error) {
        setMessage(`할 일 등록 실패: ${error.message}`);
        setLoading(false);
        return;
      }

      setTasks((prev) => [...prev, data as Task]);
      setMessage("할 일 등록 완료");
    } else {
      const { data: templateData, error: templateError } = await supabase
        .from("task_templates")
        .insert({
          workspace_id: workspace.id,
          title: newTaskTitle.trim(),
          description: newTaskDescription.trim() || null,
          assigned_member_id: newTaskAssignedMemberId,
          verification_type: newTaskVerificationType,
          due_time: newTaskDueTime || null,
          reward_points: newTaskRewardPoints,
          rollover_enabled: true,
          repeat_type: newTaskRepeatType,
          repeat_weekdays: newTaskRepeatType === "weekly" ? newTaskRepeatWeekdays : [],
          is_active: true,
          created_by_member_id: creatorMemberId,
        })
        .select(taskTemplateSelect)
        .single();

      if (templateError) {
        setMessage(`반복 할 일 등록 실패: ${templateError.message}`);
        setLoading(false);
        return;
      }

      setTemplates((prev) => [...prev, templateData as TaskTemplate]);

      const { error: generateError } = await supabase.rpc("generate_recurring_tasks");

      if (generateError) {
        setMessage(`반복 할 일 생성 실패: ${generateError.message}`);
        setLoading(false);
        return;
      }

      await loadWorkspaceData(workspace.id);
      setMessage("반복 할 일 등록 완료");
    }

    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskVerificationType("none");
    setNewTaskRewardPoints(1);
    setNewTaskRepeatType("none");
    setNewTaskRepeatWeekdays([]);
    setNewTaskDueTime("");
    setLoading(false);
  }

  async function toggleTemplateActive(template: TaskTemplate) {
    if (!isManager) {
      setMessage("방장/부방장만 가능합니다.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("task_templates")
      .update({ is_active: !template.is_active })
      .eq("id", template.id)
      .select(taskTemplateSelect)
      .single();

    if (error) {
      setMessage(`반복 할 일 상태 변경 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    const updated = data as TaskTemplate;
    setTemplates((prev) => prev.map((item) => (item.id === template.id ? updated : item)));
    setMessage(`${template.title} ${updated.is_active ? "활성화" : "비활성화"}`);
    setLoading(false);
  }

  async function deleteTemplate(template: TaskTemplate) {
    if (!isManager) {
      setMessage("방장/부방장만 가능합니다.");
      return;
    }

    const confirmed = window.confirm(
      `"${template.title}"을 삭제하시겠습니까? 이후 반복 생성이 중단됩니다.`
    );
    if (!confirmed) return;

    setLoading(true);
    setMessage("");

    const { error } = await supabase.from("task_templates").delete().eq("id", template.id);

    if (error) {
      setMessage(`삭제 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    setTemplates((prev) => prev.filter((item) => item.id !== template.id));
    setMessage(`${template.title} 삭제 완료`);
    setLoading(false);
  }

  async function rolloverNow() {
    if (!workspace) {
      setMessage("모임이 없습니다.");
      return;
    }
    if (!isManager) {
      setMessage("방장/부방장만 가능합니다.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.rpc("rollover_overdue_tasks");

    if (error) {
      setMessage(`이월 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    await loadWorkspaceData(workspace.id);
    setMessage("미완료 할 일을 이월했습니다.");
    setLoading(false);
  }

  async function submitTask(task: Task) {
    if (!workspace) {
      setMessage("모임이 없습니다.");
      return;
    }
    if (task.status !== "todo" && task.status !== "rolled_over" && task.status !== "rejected") {
      setMessage("제출할 수 없는 상태입니다.");
      return;
    }
    if (!isManager && task.assigned_member_id !== currentMember?.id) {
      setMessage("담당자만 제출할 수 있습니다.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("tasks")
      .update({ status: "submitted" })
      .eq("id", task.id)
      .select(taskSelect)
      .single();

    if (error) {
      setMessage(`제출 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    setTasks((prev) => prev.map((item) => (item.id === task.id ? (data as Task) : item)));
    setMessage(`${task.title} 제출 완료.`);
    setLoading(false);
  }

  async function submitTaskWithText(task: Task, text: string) {
    if (!workspace) {
      setMessage("모임이 없습니다.");
      return;
    }
    if (task.status !== "todo" && task.status !== "rolled_over" && task.status !== "rejected") {
      setMessage("제출할 수 없는 상태입니다.");
      return;
    }
    if (!isManager && task.assigned_member_id !== currentMember?.id) {
      setMessage("담당자만 제출할 수 있습니다.");
      return;
    }
    if (!text.trim()) {
      setMessage("증거 텍스트를 입력해주세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("tasks")
      .update({ status: "submitted", evidence_text: text.trim() })
      .eq("id", task.id)
      .select(taskSelect)
      .single();

    if (error) {
      setMessage(`제출 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    setTasks((prev) => prev.map((item) => (item.id === task.id ? (data as Task) : item)));
    setMessage(`${task.title} 제출 완료.`);
    setLoading(false);
  }

  async function submitTaskWithEvidence(task: Task, file: File) {
    if (!workspace) {
      setMessage("모임이 없습니다.");
      return;
    }
    if (task.status !== "todo" && task.status !== "rolled_over" && task.status !== "rejected") {
      setMessage("제출할 수 없는 상태입니다.");
      return;
    }
    if (!isManager && task.assigned_member_id !== currentMember?.id) {
      setMessage("담당자만 제출할 수 있습니다.");
      return;
    }

    setLoading(true);
    setMessage("");

    const filePath = `${workspace.id}/${task.id}-${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("task-evidence")
      .upload(filePath, file, { upsert: false });

    if (uploadError) {
      setMessage(`업로드 실패: ${uploadError.message}`);
      setLoading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from("task-evidence").getPublicUrl(filePath);

    const { data, error } = await supabase
      .from("tasks")
      .update({ status: "submitted", evidence_url: publicUrlData.publicUrl })
      .eq("id", task.id)
      .select(taskSelect)
      .single();

    if (error) {
      setMessage(`제출 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    setTasks((prev) => prev.map((item) => (item.id === task.id ? (data as Task) : item)));
    setMessage(`${task.title} 증거 제출 완료.`);
    setLoading(false);
  }

  async function cancelSubmission(task: Task) {
    if (!workspace) {
      setMessage("모임이 없습니다.");
      return;
    }
    if (task.status !== "submitted") {
      setMessage("제출된 상태만 취소할 수 있습니다.");
      return;
    }
    if (!isManager && task.assigned_member_id !== currentMember?.id) {
      setMessage("담당자만 취소할 수 있습니다.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("tasks")
      .update({ status: "todo" })
      .eq("id", task.id)
      .select(taskSelect)
      .single();

    if (error) {
      setMessage(`취소 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    setTasks((prev) => prev.map((item) => (item.id === task.id ? (data as Task) : item)));
    setMessage(`${task.title} 제출을 취소했습니다.`);
    setLoading(false);
  }

  async function deleteTask(task: Task) {
    if (!workspace) {
      setMessage("모임이 없습니다.");
      return;
    }

    const canDelete = isManager || task.created_by_member_id === currentMember?.id;
    if (!canDelete) {
      setMessage("본인이 만든 할 일 또는 방장/부방장만 삭제할 수 있습니다.");
      return;
    }

    const confirmed = window.confirm(`"${task.title}"을 삭제하시겠습니까? 되돌릴 수 없습니다.`);
    if (!confirmed) return;

    setLoading(true);
    setMessage("");

    const { error } = await supabase.from("tasks").delete().eq("id", task.id);

    if (error) {
      setMessage(`삭제 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    setTasks((prev) => prev.filter((item) => item.id !== task.id));
    setMessage(`${task.title} 삭제 완료`);
    setLoading(false);
  }

  async function approveTask(task: Task) {
    if (!workspace) {
      setMessage("모임이 없습니다.");
      return;
    }

    const canReview =
      isManager || (!!currentMember?.id && task.created_by_member_id === currentMember.id);
    if (!canReview) {
      setMessage("이 할 일을 만든 사람 또는 방장/부방장만 승인할 수 있습니다.");
      return;
    }
    if (task.status !== "submitted") {
      setMessage("제출된 상태만 승인할 수 있습니다.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("tasks")
      .update({ status: "approved" })
      .eq("id", task.id)
      .select(taskSelect)
      .single();

    if (error) {
      setMessage(`승인 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    setTasks((prev) => prev.map((item) => (item.id === task.id ? (data as Task) : item)));

    if (task.assigned_member_id && task.reward_points > 0) {
      const { data: txData, error: txError } = await supabase
        .from("reward_transactions")
        .insert({
          workspace_id: workspace.id,
          member_id: task.assigned_member_id,
          amount: task.reward_points,
          transaction_type: "earn",
          source_type: "task",
          source_id: task.id,
          memo: `${task.title} 완료`,
          created_by_member_id: currentMember?.id || null,
        })
        .select(rewardTxSelect)
        .single();

      if (txError) {
        setMessage(`포인트 지급 실패: ${txError.message}`);
        setLoading(false);
        return;
      }

      setRewardTransactions((prev) => [...prev, txData as RewardTransaction]);
    }

    setMessage(`${task.title} 승인 및 포인트 지급 완료`);
    setLoading(false);
  }

  async function rejectTask(task: Task) {
    if (!workspace) {
      setMessage("모임이 없습니다.");
      return;
    }

    const canReview =
      isManager || (!!currentMember?.id && task.created_by_member_id === currentMember.id);
    if (!canReview) {
      setMessage("이 할 일을 만든 사람 또는 방장/부방장만 승인할 수 있습니다.");
      return;
    }
    if (task.status !== "submitted") {
      setMessage("제출된 상태만 반려할 수 있습니다.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("tasks")
      .update({ status: "rejected" })
      .eq("id", task.id)
      .select(taskSelect)
      .single();

    if (error) {
      setMessage(`반려 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    setTasks((prev) => prev.map((item) => (item.id === task.id ? (data as Task) : item)));
    setMessage(`${task.title} 반려했습니다.`);
    setLoading(false);
  }

  return {
    newTaskTitle,
    setNewTaskTitle,
    newTaskDescription,
    setNewTaskDescription,
    newTaskAssignedMemberId,
    setNewTaskAssignedMemberId,
    newTaskVerificationType,
    setNewTaskVerificationType,
    newTaskDueTime,
    setNewTaskDueTime,
    newTaskRewardPoints,
    setNewTaskRewardPoints,
    newTaskRepeatType,
    setNewTaskRepeatType,
    newTaskRepeatWeekdays,
    toggleRepeatWeekday,
    createTask,
    toggleTemplateActive,
    deleteTemplate,
    rolloverNow,
    submitTask,
    submitTaskWithText,
    submitTaskWithEvidence,
    cancelSubmission,
    deleteTask,
    approveTask,
    rejectTask,
    resetTaskState,
  };
}
