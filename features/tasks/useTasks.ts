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
  const [newTaskAssignedMemberIds, setNewTaskAssignedMemberIds] = useState<string[]>([]);
  const [newTaskVerificationType, setNewTaskVerificationType] = useState("none");
  const [newTaskDueTime, setNewTaskDueTime] = useState("");
  const [newTaskRewardPoints, setNewTaskRewardPoints] = useState(1);
  const [newTaskRepeatType, setNewTaskRepeatType] = useState<RepeatType>("none");
  const [newTaskRepeatWeekdays, setNewTaskRepeatWeekdays] = useState<number[]>([]);

  function resetTaskState() {
    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskAssignedMemberIds([]);
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

  function toggleAssignedMember(memberId: string) {
    setNewTaskAssignedMemberIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  }

  // 완료 처리 시 담당자에게 포인트를 지급하는 공용 함수 (여러 곳에서 재사용)
  async function grantRewardForTask(task: Task) {
    if (!workspace) return;
    if (!task.assigned_member_id || task.reward_points <= 0) return;

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
      return;
    }

    setRewardTransactions((prev) => [...prev, txData as RewardTransaction]);
  }

  async function createTask() {
    if (!workspace) {
      setMessage("모임이 없습니다.");
      return;
    }
    if (!newTaskTitle.trim()) {
      setMessage("할 일을 입력해주세요.");
      return;
    }
    if (newTaskAssignedMemberIds.length === 0) {
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
      const rows = newTaskAssignedMemberIds.map((memberId) => ({
        workspace_id: workspace.id,
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || null,
        task_type: "custom",
        status: "todo",
        due_date: selectedDate,
        assigned_member_id: memberId,
        verification_type: newTaskVerificationType,
        due_time: newTaskDueTime || null,
        verification_required: newTaskVerificationType !== "none",
        reward_points: newTaskRewardPoints,
        rollover_enabled: true,
        created_by_member_id: creatorMemberId,
      }));
  
      const { data, error } = await supabase.from("tasks").insert(rows).select(taskSelect);
  
      if (error) {
        setMessage(`할 일 생성 실패: ${error.message}`);
        setLoading(false);
        return;
      }
  
      setTasks((prev) => [...prev, ...((data ?? []) as Task[])]);
      setMessage(
        newTaskAssignedMemberIds.length > 1
          ? `${newTaskAssignedMemberIds.length}명에게 할 일을 각각 만들었어요`
          : "할 일 생성 완료"
      );
    } else {
      const rows = newTaskAssignedMemberIds.map((memberId) => ({
        workspace_id: workspace.id,
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || null,
        assigned_member_id: memberId,
        verification_type: newTaskVerificationType,
        due_time: newTaskDueTime || null,
        reward_points: newTaskRewardPoints,
        rollover_enabled: true,
        repeat_type: newTaskRepeatType,
        repeat_weekdays: newTaskRepeatType === "weekly" ? newTaskRepeatWeekdays : [],
        is_active: true,
        created_by_member_id: creatorMemberId,
      }));
  
      const { data: templateData, error: templateError } = await supabase
        .from("task_templates")
        .insert(rows)
        .select(taskTemplateSelect);
  
      if (templateError) {
        setMessage(`반복 할 일 생성 실패: ${templateError.message}`);
        setLoading(false);
        return;
      }
  
      setTemplates((prev) => [...prev, ...((templateData ?? []) as TaskTemplate[])]);
  
      const { error: generateError } = await supabase.rpc("generate_recurring_tasks");
  
      if (generateError) {
        setMessage(`반복 할 일 생성 실패: ${generateError.message}`);
        setLoading(false);
        return;
      }
  
      await loadWorkspaceData(workspace.id);
      setMessage("반복 할 일 생성 완료");
    }
  
    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskAssignedMemberIds([]);
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
  
  async function reorderTasks(dateKey: string, orderedTaskIds: string[]) {
    if (!workspace) return;
  
    setTasks((prev) => {
      const next = [...prev];
      orderedTaskIds.forEach((id, index) => {
        const targetIndex = next.findIndex((task) => task.id === id);
        if (targetIndex !== -1) {
          next[targetIndex] = { ...next[targetIndex], order_index: index };
        }
      });
      return next;
    });
  
    const results = await Promise.all(
      orderedTaskIds.map((id, index) =>
        supabase.from("tasks").update({ order_index: index }).eq("id", id)
      )
    );
  
    const failed = results.find((result) => result.error);
    if (failed?.error) {
      setMessage(`순서 저장 실패: ${failed.error.message}`);
    }
  }

  async function updateTask(
    taskId: string,
    patch: {
      title: string;
      description: string;
      verificationType: string;
      dueTime: string;
      rewardPoints: number;
      dueDate: string;
    }
  ) {
    if (!workspace) {
      setMessage("모임이 없습니다.");
      return;
    }
    if (!patch.title.trim()) {
      setMessage("할 일을 입력해주세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("tasks")
      .update({
        title: patch.title.trim(),
        description: patch.description.trim() || null,
        verification_type: patch.verificationType,
        verification_required: patch.verificationType !== "none",
        due_time: patch.dueTime || null,
        reward_points: patch.rewardPoints,
        due_date: patch.dueDate,
      })
      .eq("id", taskId)
      .select(taskSelect)
      .single();

    if (error) {
      setMessage(`수정 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    setTasks((prev) => prev.map((item) => (item.id === taskId ? (data as Task) : item)));
    setMessage("할 일을 수정했습니다.");
    setLoading(false);
  }

  async function reorderTasksAcrossDates(
    assignments: { id: string; dueDate: string; orderIndex: number }[]
  ) {
    if (!workspace || assignments.length === 0) return;

    setTasks((prev) => {
      const next = [...prev];
      assignments.forEach(({ id, dueDate, orderIndex }) => {
        const targetIndex = next.findIndex((task) => task.id === id);
        if (targetIndex !== -1) {
          next[targetIndex] = { ...next[targetIndex], due_date: dueDate, order_index: orderIndex };
        }
      });
      return next;
    });

    const results = await Promise.all(
      assignments.map(({ id, dueDate, orderIndex }) =>
        supabase.from("tasks").update({ due_date: dueDate, order_index: orderIndex }).eq("id", id)
      )
    );

    const failed = results.find((result) => result.error);
    if (failed?.error) {
      setMessage(`순서 저장 실패: ${failed.error.message}`);
    }
  }

  async function submitTask(task: Task) {
    if (!workspace) {
      setMessage("모임이 없습니다.");
      return;
    }
    if (task.status !== "todo" && task.status !== "rolled_over" && task.status !== "rejected") {
      setMessage("완료 처리할 수 없는 상태입니다.");
      return;
    }
    if (!isManager && task.assigned_member_id !== currentMember?.id) {
      setMessage("담당자만 완료 처리할 수 있습니다.");
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
      setMessage(`완료 처리 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    setTasks((prev) => prev.map((item) => (item.id === task.id ? (data as Task) : item)));
    await grantRewardForTask(task);
    setMessage(`${task.title} 완료! 포인트가 지급되었어요.`);
    setLoading(false);
  }

  async function submitTaskWithText(task: Task, text: string) {
    if (!workspace) {
      setMessage("모임이 없습니다.");
      return;
    }
    if (task.status !== "todo" && task.status !== "rolled_over" && task.status !== "rejected") {
      setMessage("완료 처리할 수 없는 상태입니다.");
      return;
    }
    if (!isManager && task.assigned_member_id !== currentMember?.id) {
      setMessage("담당자만 완료 처리할 수 있습니다.");
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
      .update({ status: "approved", evidence_text: text.trim() })
      .eq("id", task.id)
      .select(taskSelect)
      .single();

    if (error) {
      setMessage(`완료 처리 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    setTasks((prev) => prev.map((item) => (item.id === task.id ? (data as Task) : item)));
    await grantRewardForTask(task);
    setMessage(`${task.title} 완료! 포인트가 지급되었어요.`);
    setLoading(false);
  }

  async function submitTaskWithEvidence(task: Task, file: File) {
    if (!workspace) {
      setMessage("모임이 없습니다.");
      return;
    }
    if (task.status !== "todo" && task.status !== "rolled_over" && task.status !== "rejected") {
      setMessage("완료 처리할 수 없는 상태입니다.");
      return;
    }
    if (!isManager && task.assigned_member_id !== currentMember?.id) {
      setMessage("담당자만 완료 처리할 수 있습니다.");
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
      .update({ status: "approved", evidence_url: publicUrlData.publicUrl })
      .eq("id", task.id)
      .select(taskSelect)
      .single();

    if (error) {
      setMessage(`완료 처리 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    setTasks((prev) => prev.map((item) => (item.id === task.id ? (data as Task) : item)));
    await grantRewardForTask(task);
    setMessage(`${task.title} 완료! 포인트가 지급되었어요.`);
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
    await grantRewardForTask(task);
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

  // 완료(approved)된 할 일을 되돌리고, 완료 시 지급했던 포인트를 역방향 거래로 회수한다.
  // 매니저(방장/부방장)만 가능하다 — tasks 트리거와 reward_transactions RLS 모두 매니저 기준.
  async function uncompleteTask(task: Task) {
    if (!workspace) {
      setMessage("모임이 없습니다.");
      return;
    }
    if (!isManager) {
      setMessage("방장/부방장만 완료를 취소할 수 있습니다.");
      return;
    }
    if (task.status !== "approved") {
      setMessage("완료된 할 일만 취소할 수 있습니다.");
      return;
    }

    const confirmed = window.confirm("완료를 취소하고 포인트를 회수할까요?");
    if (!confirmed) return;

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("tasks")
      .update({ status: "todo" })
      .eq("id", task.id)
      .select(taskSelect)
      .single();

    if (error) {
      setMessage(`완료 취소 실패: ${error.message}`);
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
          amount: -task.reward_points,
          transaction_type: "spend",
          source_type: "task",
          source_id: task.id,
          memo: `${task.title} 완료 취소`,
          created_by_member_id: currentMember?.id || null,
        })
        .select(rewardTxSelect)
        .single();

      if (txError) {
        setMessage(`포인트 회수 실패: ${txError.message}`);
        setLoading(false);
        return;
      }

      setRewardTransactions((prev) => [...prev, txData as RewardTransaction]);
    }

    setMessage(`${task.title} 완료를 취소했어요. 포인트를 회수했습니다.`);
    setLoading(false);
  }

  return {
    newTaskTitle,
    setNewTaskTitle,
    newTaskDescription,
    setNewTaskDescription,
    newTaskAssignedMemberIds,
    toggleAssignedMember,
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
    reorderTasks,
    reorderTasksAcrossDates,
    updateTask,
    submitTask,
    submitTaskWithText,
    submitTaskWithEvidence,
    cancelSubmission,
    deleteTask,
    approveTask,
    rejectTask,
    uncompleteTask,
    resetTaskState,
  };
}
