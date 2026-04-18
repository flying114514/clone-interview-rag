import { request } from './request';
import type {
  CollectInterviewQuestionResponse,
  CreateInterviewRequest,
  CreateInterviewTaskResponse,
  CurrentQuestionResponse,
  InterviewCreationTaskStatus,
  InterviewReport,
  InterviewSession,
  SubmitAnswerRequest,
  SubmitAnswerResponse
} from '../types/interview';

export const interviewApi = {
  /**
   * 创建面试异步任务
   */
  async createSessionTask(req: CreateInterviewRequest): Promise<CreateInterviewTaskResponse> {
    return request.post<CreateInterviewTaskResponse>('/api/interview/sessions/tasks', req);
  },

  /**
   * 查询创建面试异步任务状态
   */
  async getCreateSessionTaskStatus(taskId: string): Promise<InterviewCreationTaskStatus> {
    return request.get<InterviewCreationTaskStatus>(`/api/interview/sessions/tasks/${taskId}`);
  },

  /**
   * 创建面试会话
   */
  async createSession(req: CreateInterviewRequest): Promise<InterviewSession> {
    return request.post<InterviewSession>('/api/interview/sessions', req, {
      timeout: 420000, // 同步生成问题与参考答案，适当放宽超时
    });
  },

  /**
   * 获取会话信息
   */
  async getSession(sessionId: string): Promise<InterviewSession> {
    return request.get<InterviewSession>(`/api/interview/sessions/${sessionId}`);
  },

  /**
   * 获取当前问题
   */
  async getCurrentQuestion(sessionId: string): Promise<CurrentQuestionResponse> {
    return request.get<CurrentQuestionResponse>(`/api/interview/sessions/${sessionId}/question`);
  },

  /**
   * 提交答案
   */
  async submitAnswer(req: SubmitAnswerRequest): Promise<SubmitAnswerResponse> {
    return request.post<SubmitAnswerResponse>(
      `/api/interview/sessions/${req.sessionId}/answers`,
      { questionIndex: req.questionIndex, answer: req.answer },
      {
        timeout: 180000,
      }
    );
  },

  /**
   * 获取面试报告
   */
  async getReport(sessionId: string): Promise<InterviewReport> {
    return request.get<InterviewReport>(`/api/interview/sessions/${sessionId}/report`, {
      timeout: 180000,
    });
  },

  /**
   * 查找未完成的面试会话
   */
  async findUnfinishedSession(resumeId: number): Promise<InterviewSession | null> {
    try {
      return await request.get<InterviewSession>(`/api/interview/sessions/unfinished/${resumeId}`);
    } catch {
      return null;
    }
  },

  /**
   * 暂存答案（不进入下一题）
   */
  async saveAnswer(req: SubmitAnswerRequest): Promise<void> {
    return request.put<void>(
      `/api/interview/sessions/${req.sessionId}/answers`,
      { questionIndex: req.questionIndex, answer: req.answer }
    );
  },

  /**
   * 提前交卷
   */
  async completeInterview(sessionId: string): Promise<void> {
    return request.post<void>(`/api/interview/sessions/${sessionId}/complete`);
  },

  /**
   * 收藏题目到知识库
   */
  async collectQuestion(sessionId: string, questionIndex: number): Promise<CollectInterviewQuestionResponse> {
    return request.post<CollectInterviewQuestionResponse>(`/api/interview/sessions/${sessionId}/collect`, {
      questionIndex,
    });
  },

  /**
   * 取消收藏题目
   */
  async uncollectQuestion(sessionId: string, questionIndex: number): Promise<CollectInterviewQuestionResponse> {
    return request.delete<CollectInterviewQuestionResponse>(`/api/interview/sessions/${sessionId}/collect?questionIndex=${questionIndex}`);
  },
};
