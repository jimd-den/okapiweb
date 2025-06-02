
// src/components/widgets/TodoSummaryWidget.tsx
"use client";

import React, { useMemo, useCallback } from 'react';
import type { Todo, TodoStatus } from '@/domain/entities/todo.entity';
import type { UseSpaceDialogsReturn } from '@/hooks/use-space-dialogs';
// Removed: import type { UseSpaceTodosReturn } from '@/hooks/data/use-space-todos';
import type { SpaceMetrics } from '@/hooks/data/use-space-metrics';
// Removed: import type { CreateTodoUseCase } from '@/application/use-cases';
import { useSpaceTodos, type UseSpaceTodosReturn } from '@/hooks/data/use-space-todos'; // Import useSpaceTodos directly

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListTodo, History, ClipboardCheck } from 'lucide-react';

// Dialog Imports
import { TodoListDialog } from '@/components/dialogs/todo-list-dialog';
import { CreateTodoDialog } from '@/components/dialogs/create-todo-dialog';
import { ImageCaptureDialogView } from '@/components/dialogs/image-capture-dialog-view';


const TODO_BOARD_COLUMNS_UI_DATA: Record<TodoStatus, { id: TodoStatus; title: string; icon: React.ReactNode; }> = {
  todo: { id: 'todo', title: 'To Do', icon: <ListTodo className="h-5 w-5" /> },
  doing: { id: 'doing', title: 'Doing', icon: <History className="h-5 w-5" /> },
  done: { id: 'done', title: 'Done', icon: <ClipboardCheck className="h-5 w-5" /> },
};

interface TodoSummaryWidgetProps {
  spaceId: string; // Still needed
  metrics: Pick<SpaceMetrics, 'todoStatusItems' | 'doingStatusItems' | 'doneStatusItems'>;
  dialogs: Pick<UseSpaceDialogsReturn, 
    'isTodoListDialogOpen' | 
    'currentOpenTodoListStatus' | 
    'openTodoListDialog' | 
    'closeTodoListDialog' | 
    'isCreateTodoDialogOpen' | 
    'openCreateTodoDialog' | 
    'closeCreateTodoDialog'
  >;
  // Removed: todosHook prop
  // Removed: createTodoUseCase prop
  onTodosChangedForMetrics: (todos: Todo[]) => void; // For updating parent metrics
}

export function TodoSummaryWidget({
  spaceId,
  metrics,
  dialogs,
  onTodosChangedForMetrics,
}: TodoSummaryWidgetProps) {

  // Instantiate useSpaceTodos hook internally
  const todosHook: UseSpaceTodosReturn = useSpaceTodos({
    spaceId,
    onTodosChanged: onTodosChangedForMetrics, // Pass the callback to update metrics
  });

  const todoBoardButtonStructure = React.useMemo(() => [
    { status: 'todo' as TodoStatus, title: 'To Do', icon: TODO_BOARD_COLUMNS_UI_DATA.todo.icon, items: metrics.todoStatusItems },
    { status: 'doing' as TodoStatus, title: 'Doing', icon: TODO_BOARD_COLUMNS_UI_DATA.doing.icon, items: metrics.doingStatusItems },
    { status: 'done' as TodoStatus, title: 'Done', icon: TODO_BOARD_COLUMNS_UI_DATA.done.icon, items: metrics.doneStatusItems },
  ], [metrics.todoStatusItems, metrics.doingStatusItems, metrics.doneStatusItems]);

  return (
    <>
      <Card className="shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="p-2 sm:p-3 pb-1 sm:pb-2">
          <CardTitle className="text-base sm:text-lg text-center">To-Do Board</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex divide-x divide-border">
            {todoBoardButtonStructure.map((col) => {
              const itemsCount = col.items.length;
              return (
                <Card
                  key={col.status}
                  onClick={() => dialogs.openTodoListDialog(col.status)}
                  className="flex-1 flex flex-col items-center justify-center p-2 sm:p-3 hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded-none first:rounded-bl-md last:rounded-br-md cursor-pointer shadow-none border-0"
                  role="button" tabIndex={0}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && dialogs.openTodoListDialog(col.status)}
                >
                  {col.icon && React.cloneElement(col.icon as React.ReactElement, { className: "h-5 w-5 sm:h-6 sm:w-6 text-primary mb-1" })}
                  <CardTitle className="text-xs sm:text-sm md:text-md">{col.title}</CardTitle>
                  <CardDescription className="text-[0.65rem] sm:text-xs">{itemsCount} item(s)</CardDescription>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {dialogs.isCreateTodoDialogOpen && (
        <CreateTodoDialog
          isOpen={dialogs.isCreateTodoDialogOpen}
          onClose={dialogs.closeCreateTodoDialog}
          spaceId={spaceId}
          createTodoUseCase={todosHook.createTodoUseCase} // Use from internal todosHook
          onTodoCreated={async (newTodoPartialData) => {
            try {
              await todosHook.handleTodoCreatedFromDialog(newTodoPartialData);
              dialogs.closeCreateTodoDialog();
            } catch (e) {
              console.error("CreateTodoDialog submission failed via TodoSummaryWidget:", e);
              // Potentially set an error state in the dialog if it supports it
            }
          }}
        />
      )}

      {dialogs.isTodoListDialogOpen && dialogs.currentOpenTodoListStatus !== null && (
        <TodoListDialog
          isOpen={dialogs.isTodoListDialogOpen}
          onClose={dialogs.closeTodoListDialog}
          title={`${TODO_BOARD_COLUMNS_UI_DATA[dialogs.currentOpenTodoListStatus]?.title || 'Tasks'}`}
          allTodos={todosHook.allTodos || []} // Use from internal todosHook
          initialStatusFilter={dialogs.currentOpenTodoListStatus}
          onUpdateStatus={todosHook.handleUpdateTodoStatus}
          onDelete={todosHook.handleDeleteTodo}
          onUpdateDescription={todosHook.handleUpdateTodoDescription}
          onOpenImageCapture={todosHook.imageCaptureHook.handleOpenImageCaptureDialog}
          onRemoveImage={todosHook.handleRemoveImage}
          isSubmittingParent={todosHook.isLoadingTodos}
          newlyAddedTodoId={todosHook.newlyAddedTodoId}
          onOpenCreateTodoDialog={dialogs.openCreateTodoDialog}
        />
      )}

      {todosHook.imageCaptureHook.selectedItemForImage && (
        <ImageCaptureDialogView
            isOpen={todosHook.imageCaptureHook.showCameraDialog}
            onClose={todosHook.imageCaptureHook.handleCloseImageCaptureDialog}
            dialogTitle={`Capture ${todosHook.imageCaptureHook.captureMode || ''} Image for To-Do`}
            itemDescription={todosHook.imageCaptureHook.selectedItemForImage?.description}
            videoRef={todosHook.imageCaptureHook.videoRef}
            canvasRef={todosHook.imageCaptureHook.canvasRef}
            videoDevices={todosHook.imageCaptureHook.videoDevices}
            selectedDeviceId={todosHook.imageCaptureHook.selectedDeviceId}
            onDeviceChange={todosHook.imageCaptureHook.handleDeviceChange}
            hasCameraPermission={todosHook.imageCaptureHook.hasCameraPermission}
            isCheckingPermission={todosHook.imageCaptureHook.isCheckingPermission}
            stream={todosHook.imageCaptureHook.stream}
            onCaptureAndSave={todosHook.handleCaptureAndSaveImage}
            isCapturingImage={todosHook.imageCaptureHook.isCapturingImage}
        />
      )}
    </>
  );
}
    

    