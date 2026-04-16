import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { authApi, saveAuthSession } from '../api/auth';
import { getErrorMessage } from '../api/request';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || '/upload';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.login(username.trim(), password);
      saveAuthSession(res);
      toast.success('登录成功');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-sky-bg app-clouds flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ds-fg text-ds-bg dark:bg-neutral-100 dark:text-neutral-950">
          <Sparkles className="h-6 w-6" strokeWidth={1.75} />
        </div>
        <div>
          <p className="text-[18px] font-bold text-ds-fg dark:text-neutral-50">AI Interview</p>
          <p className="text-[13px] text-ds-fg-muted dark:text-neutral-500">登录后使用简历与知识库功能</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[400px] rounded-card border border-white/30 bg-white/[0.2] p-8 shadow-[0_20px_60px_rgba(30,64,175,0.2)] backdrop-blur-[14px]"
      >
        <h1 className="text-[20px] font-bold text-ds-fg dark:text-neutral-50">登录</h1>
        <p className="mt-1 text-[14px] text-ds-fg-muted dark:text-neutral-400">使用已注册的用户名与密码</p>

        <label className="mt-6 block text-[13px] font-semibold text-ds-fg dark:text-neutral-200">用户名</label>
        <input
          value={username}
          onChange={e => setUsername(e.target.value)}
          autoComplete="username"
          className="mt-1.5 w-full rounded-pill border border-ds-border bg-ds-bg px-4 py-2.5 text-[15px] text-ds-fg outline-none focus:border-ds-fg dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-neutral-200"
          placeholder="用户名"
          required
          minLength={3}
        />

        <label className="mt-4 block text-[13px] font-semibold text-ds-fg dark:text-neutral-200">密码</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="current-password"
          className="mt-1.5 w-full rounded-pill border border-ds-border bg-ds-bg px-4 py-2.5 text-[15px] text-ds-fg outline-none focus:border-ds-fg dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-neutral-200"
          placeholder="密码"
          required
          minLength={8}
        />

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-pill bg-ds-fg py-3 text-[15px] font-semibold text-ds-bg transition enabled:hover:opacity-90 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-950"
        >
          {loading ? '登录中…' : '登录'}
        </button>

        <p className="mt-6 text-center text-[14px] text-ds-fg-muted dark:text-neutral-400">
          没有账号？{' '}
          <Link to="/register" className="font-semibold text-sky-950 hover:underline">
            注册
          </Link>
        </p>
      </form>
    </div>
  );
}
