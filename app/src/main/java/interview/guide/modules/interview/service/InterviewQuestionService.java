package interview.guide.modules.interview.service;

import interview.guide.common.ai.StructuredOutputInvoker;
import interview.guide.common.exception.ErrorCode;
import interview.guide.modules.interview.model.InterviewQuestionDTO;
import interview.guide.modules.interview.model.InterviewQuestionDTO.QuestionType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.ai.converter.BeanOutputConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
public class InterviewQuestionService {
    private static final Logger log = LoggerFactory.getLogger(InterviewQuestionService.class);
    private static final double PROJECT_RATIO = 0.20;
    private static final double MYSQL_RATIO = 0.20;
    private static final double REDIS_RATIO = 0.20;
    private static final double JAVA_BASIC_RATIO = 0.10;
    private static final double JAVA_COLLECTION_RATIO = 0.10;
    private static final double JAVA_CONCURRENT_RATIO = 0.10;
    private static final int MAX_FOLLOW_UP_COUNT = 2;

    private final ChatClient chatClient;
    private final PromptTemplate systemPromptTemplate;
    private final PromptTemplate userPromptTemplate;
    private final BeanOutputConverter<QuestionListDTO> outputConverter;
    private final StructuredOutputInvoker structuredOutputInvoker;
    private final int followUpCount;

    private record QuestionListDTO(List<QuestionDTO> questions) {}
    private record QuestionDTO(String question, String type, String category, List<String> followUps) {}
    private record QuestionDistribution(int project, int mysql, int redis, int javaBasic, int javaCollection, int javaConcurrent, int spring) {}
    private record QuestionSeed(String question, QuestionType type, String category, int priority) {}

    public InterviewQuestionService(
        ChatClient.Builder chatClientBuilder,
        StructuredOutputInvoker structuredOutputInvoker,
        @Value("classpath:prompts/interview-question-system.st") Resource systemPromptResource,
        @Value("classpath:prompts/interview-question-user.st") Resource userPromptResource,
        @Value("${app.interview.follow-up-count:1}") int followUpCount
    ) throws IOException {
        this.chatClient = chatClientBuilder.build();
        this.structuredOutputInvoker = structuredOutputInvoker;
        this.systemPromptTemplate = new PromptTemplate(systemPromptResource.getContentAsString(StandardCharsets.UTF_8));
        this.userPromptTemplate = new PromptTemplate(userPromptResource.getContentAsString(StandardCharsets.UTF_8));
        this.outputConverter = new BeanOutputConverter<>(QuestionListDTO.class);
        this.followUpCount = Math.max(0, Math.min(followUpCount, MAX_FOLLOW_UP_COUNT));
    }

    public List<InterviewQuestionDTO> generateQuestions(String resumeText, int questionCount, List<String> historicalQuestions) {
        String safeResumeText = resumeText == null ? "" : resumeText;
        log.info("开始生成面试问题，简历长度: {}, 问题数量: {}, 历史问题数: {}",
            safeResumeText.length(), questionCount, historicalQuestions != null ? historicalQuestions.size() : 0);
        try {
            QuestionDistribution d = calculateDistribution(questionCount);
            Map<String, Object> vars = new HashMap<>();
            vars.put("questionCount", questionCount);
            vars.put("projectCount", d.project);
            vars.put("mysqlCount", d.mysql);
            vars.put("redisCount", d.redis);
            vars.put("javaBasicCount", d.javaBasic);
            vars.put("javaCollectionCount", d.javaCollection);
            vars.put("javaConcurrentCount", d.javaConcurrent);
            vars.put("springCount", d.spring);
            vars.put("followUpCount", followUpCount);
            vars.put("resumeText", safeResumeText);
            vars.put("generationHint", buildGenerationHint(safeResumeText, historicalQuestions));
            vars.put("historicalQuestions", formatHistoricalQuestions(historicalQuestions));

            QuestionListDTO dto = structuredOutputInvoker.invoke(
                chatClient,
                systemPromptTemplate.render() + "\n\n" + outputConverter.getFormat(),
                userPromptTemplate.render(vars),
                outputConverter,
                ErrorCode.INTERVIEW_QUESTION_GENERATION_FAILED,
                "面试问题生成失败：",
                "结构化问题生成",
                log
            );

            List<InterviewQuestionDTO> questions = convertToQuestions(dto);
            if (!questions.isEmpty()) {
                return questions;
            }
            log.warn("AI 返回空题目，使用动态兜底题库");
        } catch (Exception e) {
            log.error("生成面试问题失败: {}", e.getMessage(), e);
        }
        return generateDefaultQuestions(safeResumeText, questionCount, historicalQuestions);
    }

    public List<InterviewQuestionDTO> generateQuestions(String resumeText, int questionCount) {
        return generateQuestions(resumeText, questionCount, null);
    }

    private QuestionDistribution calculateDistribution(int total) {
        int project = Math.max(1, (int) Math.round(total * PROJECT_RATIO));
        int mysql = Math.max(1, (int) Math.round(total * MYSQL_RATIO));
        int redis = Math.max(1, (int) Math.round(total * REDIS_RATIO));
        int javaBasic = Math.max(1, (int) Math.round(total * JAVA_BASIC_RATIO));
        int javaCollection = (int) Math.round(total * JAVA_COLLECTION_RATIO);
        int javaConcurrent = (int) Math.round(total * JAVA_CONCURRENT_RATIO);
        int spring = Math.max(0, total - project - mysql - redis - javaBasic - javaCollection - javaConcurrent);
        return new QuestionDistribution(project, mysql, redis, javaBasic, javaCollection, javaConcurrent, spring);
    }

    private List<InterviewQuestionDTO> convertToQuestions(QuestionListDTO dto) {
        List<InterviewQuestionDTO> questions = new ArrayList<>();
        if (dto == null || dto.questions() == null) {
            return questions;
        }
        int index = 0;
        for (QuestionDTO q : dto.questions()) {
            if (q == null || q.question() == null || q.question().isBlank()) {
                continue;
            }
            QuestionType type = parseQuestionType(q.type());
            int mainQuestionIndex = index;
            questions.add(InterviewQuestionDTO.create(index++, q.question().trim(), type, q.category(), false, null));
            List<String> followUps = sanitizeFollowUps(q.followUps());
            for (int i = 0; i < followUps.size(); i++) {
                questions.add(InterviewQuestionDTO.create(index++, followUps.get(i), type, buildFollowUpCategory(q.category(), i + 1), true, mainQuestionIndex));
            }
        }
        return questions;
    }

    private QuestionType parseQuestionType(String typeStr) {
        try {
            return QuestionType.valueOf(typeStr.toUpperCase(Locale.ROOT));
        } catch (Exception e) {
            return QuestionType.JAVA_BASIC;
        }
    }

    private List<InterviewQuestionDTO> generateDefaultQuestions(String resumeText, int count, List<String> historicalQuestions) {
        Set<String> history = toNormalizedSet(historicalQuestions);
        List<QuestionSeed> seeds = buildFallbackSeeds(resumeText).stream()
            .filter(seed -> !history.contains(normalizeQuestion(seed.question())))
            .collect(Collectors.toCollection(ArrayList::new));
        if (seeds.isEmpty()) {
            seeds = buildFallbackSeeds(resumeText);
        }

        List<InterviewQuestionDTO> result = new ArrayList<>();
        int index = 0;
        for (QuestionSeed seed : seeds.stream().limit(count).toList()) {
            result.add(InterviewQuestionDTO.create(index, seed.question(), seed.type(), seed.category(), false, null));
            int mainQuestionIndex = index++;
            for (int j = 0; j < followUpCount; j++) {
                result.add(InterviewQuestionDTO.create(index++, buildFallbackFollowUp(j + 1), seed.type(), buildFollowUpCategory(seed.category(), j + 1), true, mainQuestionIndex));
            }
        }
        return result;
    }

    private List<QuestionSeed> buildFallbackSeeds(String resumeText) {
        String text = resumeText == null ? "" : resumeText.toLowerCase(Locale.ROOT);
        List<QuestionSeed> seeds = new ArrayList<>();
        seeds.add(new QuestionSeed("请挑一个你简历里最能体现业务价值的项目，详细说明你的职责分工、关键方案以及最终结果。", QuestionType.PROJECT, "项目经历", 100));
        if (containsAny(text, "mysql", "sql", "索引", "事务", "数据库")) {
            seeds.add(new QuestionSeed("你在项目里是如何做 MySQL 索引设计和 SQL 调优的？请结合一个慢查询优化案例展开说明。", QuestionType.MYSQL, "MySQL", 95));
        }
        if (containsAny(text, "redis", "缓存", "分布式锁", "lua")) {
            seeds.add(new QuestionSeed("你在项目中是如何使用 Redis 的？缓存一致性、击穿或分布式锁问题你是怎么处理的？", QuestionType.REDIS, "Redis", 94));
        }
        if (containsAny(text, "spring boot", "springboot", "spring")) {
            seeds.add(new QuestionSeed("请结合你的项目说明 Spring / Spring Boot 为你解决了什么问题，核心自动装配或 Bean 管理机制你是怎么理解的？", QuestionType.SPRING_BOOT, "Spring Boot", 93));
        }
        if (containsAny(text, "线程池", "并发", "多线程", "锁", "线程")) {
            seeds.add(new QuestionSeed("你在实际项目里处理过哪些并发问题？请结合线程池、锁竞争或异步编排中的一个场景具体说明。", QuestionType.JAVA_CONCURRENT, "Java并发", 92));
        }
        if (containsAny(text, "jvm", "gc", "内存", "异常")) {
            seeds.add(new QuestionSeed("请结合你的开发经验，谈谈一次 JVM、GC、异常治理或内存问题的分析与定位过程。", QuestionType.JAVA_BASIC, "Java基础", 91));
        }
        if (containsAny(text, "hashmap", "map", "list", "set", "集合")) {
            seeds.add(new QuestionSeed("Java 集合在你的项目里主要承担了什么职责？请结合一个具体场景说明为什么选这个集合以及它的底层原理。", QuestionType.JAVA_COLLECTION, "Java集合", 90));
        }
        seeds.add(new QuestionSeed("请解释一次你在项目中遇到的线上故障，从监控发现到根因定位，再到修复和复盘的完整过程。", QuestionType.PROJECT, "故障排查", 80));
        seeds.add(new QuestionSeed("synchronized、ReentrantLock、CAS 分别适合什么场景？你在项目中是如何做选择的？", QuestionType.JAVA_CONCURRENT, "Java并发", 70));
        seeds.add(new QuestionSeed("Spring AOP 和 IoC 的核心价值是什么？如果让你排查一个 Bean 注入失效问题，你会怎么定位？", QuestionType.SPRING, "Spring", 69));
        return seeds.stream().sorted(Comparator.comparingInt(QuestionSeed::priority).reversed()).collect(Collectors.toCollection(ArrayList::new));
    }

    private boolean containsAny(String text, String... keys) {
        for (String key : keys) {
            if (text.contains(key)) {
                return true;
            }
        }
        return false;
    }

    private String formatHistoricalQuestions(List<String> historicalQuestions) {
        if (historicalQuestions == null || historicalQuestions.isEmpty()) {
            return "暂无历史提问";
        }
        return historicalQuestions.stream().filter(item -> item != null && !item.isBlank()).collect(Collectors.joining("\n"));
    }

    private List<String> sanitizeFollowUps(List<String> followUps) {
        if (followUpCount == 0 || followUps == null || followUps.isEmpty()) {
            return List.of();
        }
        return followUps.stream().filter(item -> item != null && !item.isBlank()).map(String::trim).limit(followUpCount).collect(Collectors.toList());
    }

    private String buildGenerationHint(String resumeText, List<String> historicalQuestions) {
        int resumeHash = Math.abs((resumeText == null ? "" : resumeText).hashCode());
        int historySize = historicalQuestions == null ? 0 : historicalQuestions.size();
        return switch (ThreadLocalRandom.current().nextInt(3)) {
            case 0 -> "本次优先从项目细节切入，再追问原理与优化。resumeHash=" + resumeHash + ", historySize=" + historySize;
            case 1 -> "本次优先覆盖与历史问题不同的技术点，强调边界条件和故障排查。resumeHash=" + resumeHash + ", historySize=" + historySize;
            default -> "本次优先按项目落地、底层原理、实战优化组织题目，避免沿用上一轮常见表述。resumeHash=" + resumeHash + ", historySize=" + historySize;
        };
    }

    private Set<String> toNormalizedSet(List<String> questions) {
        if (questions == null || questions.isEmpty()) {
            return Set.of();
        }
        return questions.stream().filter(item -> item != null && !item.isBlank()).map(this::normalizeQuestion).collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private String normalizeQuestion(String question) {
        return question == null ? "" : question.replaceAll("\\s+", "").trim().toLowerCase(Locale.ROOT);
    }

    private String buildFollowUpCategory(String category, int order) {
        String baseCategory = (category == null || category.isBlank()) ? "追问" : category;
        return baseCategory + "（追问" + order + "）";
    }

    private String buildFallbackFollowUp(int order) {
        if (order == 1) {
            return "围绕这道题，请你继续说明当时的业务背景、约束条件，以及为什么最终采用这个方案？";
        }
        return "如果把这个场景放到更高并发、更多数据量或更严格 SLA 下，你会如何进一步优化或兜底？";
    }
}
