import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box, IconButton, Tooltip, Alert, Typography, Stack, Button, Divider,
} from "@mui/material";
import PanelLeftIcon from "@mui/icons-material/ViewSidebar";
import PanelRightIcon from "@mui/icons-material/ViewSidebarOutlined";
import AddCommentIcon from "@mui/icons-material/AddComment";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import ConversationsSidebar from "../shared/components/chat-ai/ConversationsSidebar";
import ChatMessageList from "../shared/components/chat-ai/ChatMessageList";
import ChatInputArea from "../shared/components/chat-ai/ChatInputArea";
import ContextSidebar from "../shared/components/chat-ai/ContextSidebar";
import { useAppDispatch } from "../shared/hooks/useAppDispatch";
import { useAppSelector } from "../shared/hooks/useAppSelector";
import { useCanWrite } from "../shared/hooks/useCanWrite";
import {
  fetchConversations,
  fetchHistory,
  createConversation,
  updateConversationTitle,
  sendMessage,
  fetchContextCategories,
  selectConversation,
  toggleSelectedSource,
  toggleSelectedCategory,
  clearSelectedCategories,
  clearError,
} from "../store/slices/chatAi/chatAiSlice";

const ChatAiDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const canWrite = useCanWrite();
  const {
    conversations,
    selectedId,
    messagesByConv,
    loadingConversations,
    loadingHistory,
    sending,
    selectedCategories,
    selectedSources,
    contextCategories,
    contextSources,
    contextSourcesTotal,
    contextSourcesPage,
    contextSourcesTotalPages,
    loadingContextSources,
    error,
  } = useAppSelector((s) => s.chatAi);

  const [input, setInput] = useState("");
  const [convSidebarOpen, setConvSidebarOpen] = useState(true);
  const [contextSidebarOpen, setContextSidebarOpen] = useState(true);

  useEffect(() => {
    dispatch(fetchConversations());
    dispatch(fetchContextCategories());
  }, [dispatch]);

  useEffect(() => {
    if (selectedId != null) {
      dispatch(fetchHistory(selectedId));
    }
  }, [dispatch, selectedId]);

  const messages = selectedId != null ? messagesByConv[selectedId] ?? [] : [];
  const activeConversation = conversations.find((c) => c.id === selectedId);

  const sourceLabels = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of contextSources) map[s.id] = s.label;
    return map;
  }, [contextSources]);

  const handleSelect = useCallback(
    (id: number) => dispatch(selectConversation(id)),
    [dispatch]
  );

  const handleNew = useCallback(async () => {
    if (!canWrite) return;

    const result = await dispatch(createConversation());
    if (createConversation.fulfilled.match(result)) {
      dispatch(selectConversation(result.payload.id));
    }
  }, [dispatch, canWrite]);

  const handleSend = useCallback(async () => {
    if (!canWrite || !selectedId || !input.trim() || sending) return;
    const question = input.trim();
    setInput("");
    await dispatch(
      sendMessage({
        conversationId: selectedId,
        question,
        sources: selectedSources.length ? selectedSources : undefined,
        categories: !selectedSources.length && selectedCategories.length ? selectedCategories : undefined,
      })
    );
  }, [dispatch, canWrite, selectedId, input, sending, selectedSources, selectedCategories]);

  return (
    <Box sx={{ flex: 1, display: "flex", minHeight: 0, overflow: "hidden" }}>
      {convSidebarOpen && (
        <ConversationsSidebar
          conversations={conversations}
          selectedId={selectedId}
          loading={loadingConversations}
          collapsed={false}
          canWrite={canWrite}
          onSelect={handleSelect}
          onNew={handleNew}
          onUpdateTitle={(id, title) => {
            if (canWrite) dispatch(updateConversationTitle({ id, title }));
          }}
        />
      )}

      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            px: { xs: 1.5, sm: 2 },
            py: 1.25,
            borderBottom: "1px solid",
            borderColor: "divider",
            flexShrink: 0,
            gap: 1,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} minWidth={0}>
            <Tooltip title={convSidebarOpen ? "Ocultar historial" : "Mostrar historial"}>
              <IconButton
                size="small"
                onClick={() => setConvSidebarOpen((v) => !v)}
                sx={{
                  color: convSidebarOpen ? "primary.main" : "text.disabled",
                  bgcolor: convSidebarOpen ? "rgba(74,144,217,0.1)" : "transparent",
                }}
              >
                <PanelLeftIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Box minWidth={0}>
              <Typography
                variant="subtitle2"
                noWrap
                sx={{ fontWeight: 600, color: "text.primary", lineHeight: 1.3 }}
              >
                {activeConversation?.title ?? "Chat AI"}
              </Typography>
              <Typography variant="caption" color="text.disabled" noWrap sx={{ display: "block" }}>
                {activeConversation
                  ? "Asistente de inteligencia de amenazas"
                  : "Seleccioná o creá una conversación"}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={0.5} flexShrink={0}>
            {selectedSources.length > 0 && (
              <Typography variant="caption" color="primary.main" sx={{ display: { xs: "none", sm: "block" }, mr: 0.5 }}>
                {selectedSources.length} fuente{selectedSources.length > 1 ? "s" : ""}
              </Typography>
            )}
            {canWrite && (
              <>
                <Button
                  size="small"
                  startIcon={<AddCommentIcon sx={{ fontSize: 16 }} />}
                  onClick={handleNew}
                  sx={{ display: { xs: "none", sm: "inline-flex" }, fontSize: "0.78rem" }}
                >
                  Nueva
                </Button>
                <Tooltip title="Nueva conversación">
                  <IconButton size="small" onClick={handleNew} sx={{ display: { xs: "inline-flex", sm: "none" } }}>
                    <AddCommentIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, display: { xs: "none", sm: "block" } }} />
            <Tooltip title={contextSidebarOpen ? "Ocultar contexto" : "Mostrar contexto"}>
              <IconButton
                size="small"
                onClick={() => setContextSidebarOpen((v) => !v)}
                sx={{
                  color: contextSidebarOpen ? "primary.main" : "text.disabled",
                  bgcolor: contextSidebarOpen ? "rgba(74,144,217,0.1)" : "transparent",
                }}
              >
                <PanelRightIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {error && (
          <Alert
            severity="error"
            onClose={() => dispatch(clearError())}
            sx={{ mx: 2, mt: 1, py: 0, flexShrink: 0 }}
          >
            {error}
          </Alert>
        )}

        <ChatMessageList messages={messages} loading={loadingHistory} sending={sending} />

        <ChatInputArea
          value={input}
          onChange={setInput}
          onSend={handleSend}
          sending={sending}
          disabled={!canWrite || selectedId == null}
          selectedSources={selectedSources}
          selectedCategories={selectedCategories}
          contextCategories={contextCategories}
          sourceLabels={sourceLabels}
          onRemoveSource={(id) => dispatch(toggleSelectedSource(id))}
          onToggleCategory={(id) => dispatch(toggleSelectedCategory(id))}
          onClearCategories={() => dispatch(clearSelectedCategories())}
        />
      </Box>

      {contextSidebarOpen ? (
        <ContextSidebar
          categories={contextCategories}
          sources={contextSources}
          selectedSources={selectedSources}
          total={contextSourcesTotal}
          page={contextSourcesPage}
          totalPages={contextSourcesTotalPages}
          loading={loadingContextSources}
        />
      ) : (
        <Box
          sx={{
            width: 48,
            flexShrink: 0,
            borderLeft: "1px solid",
            borderColor: "divider",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            pt: 1.5,
            gap: 1,
          }}
        >
          <Tooltip title="Mostrar contexto" placement="left">
            <IconButton size="small" onClick={() => setContextSidebarOpen(true)}>
              <FolderOpenIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {selectedSources.length > 0 && (
            <Typography variant="caption" color="primary.main" sx={{ fontSize: "0.65rem" }}>
              {selectedSources.length}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default ChatAiDashboard;
