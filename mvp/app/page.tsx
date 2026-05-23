import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* 헤더 */}
      <header className="border-b border-slate-100 px-8 py-5">
        <span className="text-xl font-extrabold tracking-tight text-slate-900">
          Code<span className="text-[#1a6d7e]">Viva</span>
        </span>
      </header>

      {/* 메인 */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-20">
        <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#1a6d7e]">
          AI 코드 이해도 검증 시스템
        </div>
        <h1 className="mb-4 text-center text-4xl font-extrabold tracking-tight text-slate-900">
          코드를 제출하고<br />이해도를 검증하세요
        </h1>
        <p className="mb-12 max-w-md text-center text-slate-500">
          학생이 제출한 코드를 AI가 분석해 맞춤형 질문을 생성하고,<br />
          음성 답변을 통해 실제 이해도를 평가합니다.
        </p>

        <div className="flex w-full max-w-xs flex-col gap-3">
          <Link
            href="/professor"
            className="block rounded-xl bg-slate-900 px-6 py-4 text-center text-sm font-bold text-white transition hover:bg-slate-800"
          >
            교수자 포털 로그인
          </Link>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 text-center">
            <p className="text-sm font-semibold text-slate-700">학생</p>
            <p className="mt-0.5 text-xs text-slate-400">교수님께 받은 과제 링크로 접속하세요</p>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-100 px-8 py-4 text-center text-xs text-slate-400">
        CodeViva — AI 기반 코드 이해도 검증
      </footer>
    </div>
  );
}
