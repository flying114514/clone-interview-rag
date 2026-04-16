from pathlib import Path

svc = Path(r"d:\JavaStudy\clone-interview-rag\app\src\main\java\interview\guide\modules\knowledgebase\service\KnowledgeBaseQueryService.java")
text = svc.read_text(encoding="utf-8")

# add fallback constant if missing
if "GENERAL_SYSTEM_PROMPT" not in text:
    text = text.replace(
        "private static final String NO_RESULT_RESPONSE = \"抱歉，在选定的知识库中未检索到相关信息。请换一个更具体的关键词或补充上下文后再试。\";\n",
        "private static final String NO_RESULT_RESPONSE = \"抱歉，在选定的知识库中未检索到相关信息。请换一个更具体的关键词或补充上下文后再试。\";\n    private static final String GENERAL_SYSTEM_PROMPT = \"你是专业问答助手。用户问题与已选知识库不强相关时，也要直接给出专业、准确、结构化的中文回答；不需要声明知识库不足。\";\n",
        1,
    )

# replace strict fallback in sync answer
text = text.replace(
    """        List<Document> relevantDocs = retrieveRelevantDocs(queryContext, knowledgeBaseIds);\n\n        if (!hasEffectiveHit(question, relevantDocs)) {\n            return NO_RESULT_RESPONSE;\n        }\n""",
    """        List<Document> relevantDocs = retrieveRelevantDocs(queryContext, knowledgeBaseIds);\n\n        // 未命中知识库时，降级为通用专业问答（更全能）\n        if (!hasEffectiveHit(question, relevantDocs)) {\n            return answerGeneralQuestion(question);\n        }\n""",
    1,
)

# replace strict fallback in stream answer
text = text.replace(
    """            List<Document> relevantDocs = retrieveRelevantDocs(queryContext, knowledgeBaseIds);\n\n            if (!hasEffectiveHit(question, relevantDocs)) {\n                return Flux.just(NO_RESULT_RESPONSE);\n            }\n""",
    """            List<Document> relevantDocs = retrieveRelevantDocs(queryContext, knowledgeBaseIds);\n\n            // 未命中知识库时，降级为通用专业问答（流式）\n            if (!hasEffectiveHit(question, relevantDocs)) {\n                return answerGeneralQuestionStream(question)\n                    .onErrorResume(e -> {\n                        log.error(\"通用问答流式输出失败: kbIds={}, error={}\", knowledgeBaseIds, e.getMessage(), e);\n                        return Flux.just(\"【错误】问答失败：AI服务暂时不可用，请稍后重试。\");\n                    });\n            }\n""",
    1,
)

if "private String answerGeneralQuestion(" not in text:
    marker = "\n    private boolean isNoResultLike(String text) {"
    insertion = """

    private String answerGeneralQuestion(String question) {
        try {
            String answer = chatClient.prompt()
                .system(GENERAL_SYSTEM_PROMPT)
                .user(question)
                .call()
                .content();
            return answer == null || answer.isBlank() ? "抱歉，我暂时无法回答这个问题，请稍后重试。" : answer.trim();
        } catch (Exception e) {
            log.error("通用问答失败: {}", e.getMessage(), e);
            throw new BusinessException(ErrorCode.KNOWLEDGE_BASE_QUERY_FAILED, "问答失败：" + e.getMessage());
        }
    }

    private Flux<String> answerGeneralQuestionStream(String question) {
        return chatClient.prompt()
            .system(GENERAL_SYSTEM_PROMPT)
            .user(question)
            .stream()
            .content();
    }
"""
    text = text.replace(marker, insertion + marker, 1)

svc.write_text(text, encoding="utf-8")
print("patched")
