import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCourse } from '../context/CourseContext';
import {
  getAnnouncementsByCourse,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../api/announcements';
import {
  getCommentsByAnnouncement,
  createAnnouncementComment,
  updateAnnouncementComment,
  deleteAnnouncementComment,
} from '../api/announcementComments';
import Header from '../components/eclass/Header';
import GlobalNav from '../components/eclass/GlobalNav';
import MainLayout from '../components/eclass/MainLayout';
import Sidebar from '../components/eclass/Sidebar';
import Footer from '../components/eclass/Footer';
import ScrollUpButton from '../components/eclass/ScrollUpButton';
import Pagination from '../components/eclass/Pagination';

const PAGE_SIZE = 15;

const formatDate = (iso) => {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

/* ──────────────────────────────────────────────────────────
   공지사항 목록
────────────────────────────────────────────────────────── */
export const AnnouncementListPage = ({ role }) => {
  const { selectedCourse } = useCourse();
  const navigate = useNavigate();
  const isInstructor = role === 'instructor';
  const currentPath = isInstructor ? '/instructor/announcements' : '/student/announcements';
  const detailPath = isInstructor ? '/instructor/announcement-detail' : '/student/announcement-detail';

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', content: '' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    if (!selectedCourse) return;
    setLoading(true);
    getAnnouncementsByCourse(selectedCourse.id)
      .then(setAnnouncements)
      .catch(() => setError('공지사항을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [selectedCourse]);

  const handleCreate = async () => {
    if (!createForm.title.trim()) { setCreateError('제목을 입력해주세요.'); return; }
    if (!createForm.content.trim()) { setCreateError('내용을 입력해주세요.'); return; }
    setCreating(true);
    setCreateError('');
    try {
      const a = await createAnnouncement({
        courseId: selectedCourse.id,
        title: createForm.title.trim(),
        content: createForm.content.trim(),
      });
      setAnnouncements((p) => [a, ...p]);
      setShowCreate(false);
      setCreateForm({ title: '', content: '' });
    } catch {
      setCreateError('작성에 실패했습니다.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#efefef] font-['malgun_gothic','Apple_SD_Gothic_Neo',arial,sans-serif] text-[12px] leading-[17px] text-[#666666]">
      <div className="absolute top-0 left-0 z-0 h-[400px] w-full bg-gradient-to-b from-[#8a8a8a] via-[#c4c4c4] to-[#efefef]" />
      <div className="relative z-10 mx-auto w-full max-w-[1100px] px-6 pt-14">
        <Header messageCount={0} checkCount={0} bellCount={0} />
        <GlobalNav />
        <MainLayout sidebar={<Sidebar currentPath={currentPath} />}>
          <div>
            <div className="mb-4 flex items-end justify-between border-b border-[#dfdfdf] pb-2">
              <h2 className="text-[26px] leading-none font-bold text-[#5a5a5a]">공지사항</h2>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span className="rounded-sm bg-[#1a6d7e] px-1 text-[10px] text-white">H</span>
                <span>›</span>
                <span className="font-bold text-[#1a6d7e]">공지사항</span>
              </div>
            </div>

            {isInstructor && (
              <div className="mb-3 flex justify-end">
                <button
                  onClick={() => { setShowCreate((v) => !v); setCreateError(''); }}
                  className="rounded-sm bg-[#1a6d7e] px-4 py-1.5 text-xs font-bold text-white hover:bg-teal-800"
                >
                  {showCreate ? '취소' : '+ 공지 작성'}
                </button>
              </div>
            )}

            {showCreate && isInstructor && (
              <div className="mb-4 border border-[#1a6d7e]/30 bg-teal-50 p-4">
                <div className="mb-2">
                  <label className="mb-0.5 block text-[11px] font-bold text-gray-600">제목</label>
                  <input
                    className="h-7 w-full border border-[#d6d6d6] bg-white px-2 text-xs focus:border-[#1a6d7e] focus:outline-none"
                    value={createForm.title}
                    onChange={(e) => setCreateForm((p) => ({ ...p, title: e.target.value }))}
                  />
                </div>
                <div className="mb-2">
                  <label className="mb-0.5 block text-[11px] font-bold text-gray-600">내용</label>
                  <textarea
                    className="h-24 w-full resize-none border border-[#d6d6d6] bg-white px-2 py-1.5 text-xs focus:border-[#1a6d7e] focus:outline-none"
                    value={createForm.content}
                    onChange={(e) => setCreateForm((p) => ({ ...p, content: e.target.value }))}
                  />
                </div>
                {createError && <p className="mb-2 text-[11px] text-red-500">{createError}</p>}
                <div className="flex justify-end">
                  <button
                    onClick={handleCreate}
                    disabled={creating}
                    className="rounded-sm bg-[#1a6d7e] px-5 py-1.5 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-60"
                  >
                    {creating ? '저장 중...' : '저장'}
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="border border-[#d3d3d3] bg-white py-12 text-center text-sm text-gray-400">
                불러오는 중...
              </div>
            ) : error ? (
              <div className="border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">{error}</div>
            ) : announcements.length === 0 ? (
              <div className="rounded border-2 border-dashed border-[#d3d3d3] bg-white py-12 text-center text-sm text-gray-400">
                등록된 공지사항이 없습니다.
              </div>
            ) : (
              <div className="border border-[#d3d3d3] bg-white">
                <table className="w-full border-t-2 border-[#7f7f7f] text-center text-[12px]">
                  <thead className="bg-[#8c8c8c] text-white">
                    <tr className="text-xs font-bold">
                      <th className="w-12 py-2.5">번호</th>
                      <th className="px-4 py-2.5 text-left">제목</th>
                      <th className="w-28 py-2.5">작성일</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e2e2]">
                    {announcements
                      .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
                      .map((a, idx) => (
                        <tr
                          key={a.id}
                          className="cursor-pointer hover:bg-[#f0f7f9]"
                          onClick={() => navigate(`${detailPath}?id=${a.id}`)}
                        >
                          <td className="py-2.5 text-gray-400">
                            {announcements.length - ((currentPage - 1) * PAGE_SIZE + idx)}
                          </td>
                          <td className="px-4 py-2.5 text-left font-semibold text-[#1a6d7e] hover:underline">
                            {a.title}
                          </td>
                          <td className="py-2.5 text-gray-500">{formatDate(a.createdAt)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(announcements.length / PAGE_SIZE)}
                  onPageChange={setCurrentPage}
                />
                <div className="border-t border-[#e2e2e2] bg-[#f8f8f8] px-4 py-2 text-right text-xs text-gray-400">
                  전체 {announcements.length}건
                </div>
              </div>
            )}
          </div>
        </MainLayout>
        <Footer />
      </div>
      <ScrollUpButton />
    </div>
  );
};

/* ──────────────────────────────────────────────────────────
   공지사항 상세
────────────────────────────────────────────────────────── */
export const AnnouncementDetailPage = ({ role }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const announcementId = searchParams.get('id');
  const isInstructor = role === 'instructor';
  const listPath = isInstructor ? '/instructor/announcements' : '/student/announcements';
  const currentPath = isInstructor ? '/instructor/announcements' : '/student/announcements';

  const [announcement, setAnnouncement] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', content: '' });
  const [saving, setSaving] = useState(false);

  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');

  useEffect(() => {
    if (!announcementId) return;
    Promise.all([
      getAnnouncement(announcementId),
      getCommentsByAnnouncement(announcementId),
    ])
      .then(([a, c]) => {
        setAnnouncement(a);
        setEditForm({ title: a.title ?? '', content: a.content ?? '' });
        setComments(Array.isArray(c) ? c : []);
      })
      .catch(() => setError('공지사항을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [announcementId]);

  const handleSave = async () => {
    if (!editForm.title.trim() || !editForm.content.trim()) return;
    setSaving(true);
    try {
      const updated = await updateAnnouncement({
        id: Number(announcementId),
        title: editForm.title.trim(),
        content: editForm.content.trim(),
      });
      setAnnouncement(updated);
      setIsEditing(false);
    } catch {
      setError('수정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('공지사항을 삭제하시겠습니까?')) return;
    try {
      await deleteAnnouncement(announcementId);
      navigate(listPath);
    } catch {
      alert('삭제에 실패했습니다.');
    }
  };

  const handlePostComment = async () => {
    if (!commentText.trim()) return;
    setPostingComment(true);
    try {
      const c = await createAnnouncementComment({
        announcementId: Number(announcementId),
        content: commentText.trim(),
      });
      setComments((p) => [...p, c]);
      setCommentText('');
    } catch {
      // silent
    } finally {
      setPostingComment(false);
    }
  };

  const handleUpdateComment = async (id) => {
    if (!editCommentText.trim()) return;
    try {
      const updated = await updateAnnouncementComment({ id, content: editCommentText.trim() });
      setComments((p) => p.map((c) => (c.id === id ? updated : c)));
      setEditingCommentId(null);
    } catch {
      // silent
    }
  };

  const handleDeleteComment = async (id) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;
    try {
      await deleteAnnouncementComment(id);
      setComments((p) => p.filter((c) => c.id !== id));
    } catch {
      // silent
    }
  };

  const PageWrapper = ({ children }) => (
    <div className="min-h-screen bg-[#efefef] font-['malgun_gothic','Apple_SD_Gothic_Neo',arial,sans-serif] text-[12px] leading-[17px] text-[#666666]">
      <div className="absolute top-0 left-0 z-0 h-[400px] w-full bg-gradient-to-b from-[#8a8a8a] via-[#c4c4c4] to-[#efefef]" />
      <div className="relative z-10 mx-auto w-full max-w-[1100px] px-6 pt-14">
        <Header messageCount={0} checkCount={0} bellCount={0} />
        <GlobalNav />
        <MainLayout sidebar={<Sidebar currentPath={currentPath} />}>{children}</MainLayout>
        <Footer />
      </div>
      <ScrollUpButton />
    </div>
  );

  if (loading) {
    return (
      <PageWrapper>
        <div className="py-12 text-center text-sm text-gray-400">불러오는 중...</div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div>
        <div className="mb-4 flex items-end justify-between border-b border-[#dfdfdf] pb-2">
          <h2 className="text-[26px] leading-none font-bold text-[#5a5a5a]">공지사항</h2>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span className="rounded-sm bg-[#1a6d7e] px-1 text-[10px] text-white">H</span>
            <span>›</span>
            <Link to={listPath} className="hover:underline">공지사항</Link>
            <span>›</span>
            <span className="font-bold text-[#1a6d7e]">상세</span>
          </div>
        </div>

        {error && <p className="mb-4 text-xs text-red-500">{error}</p>}

        {/* 공지 본문 */}
        <div className="overflow-hidden rounded border border-[#d3d3d3] bg-white">
          {isEditing ? (
            <div className="space-y-3 p-5">
              <input
                className="h-8 w-full border border-[#d6d6d6] px-2 text-sm font-bold focus:border-[#1a6d7e] focus:outline-none"
                value={editForm.title}
                onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
              />
              <textarea
                className="h-40 w-full resize-none border border-[#d6d6d6] px-3 py-2 text-xs leading-5 focus:border-[#1a6d7e] focus:outline-none"
                value={editForm.content}
                onChange={(e) => setEditForm((p) => ({ ...p, content: e.target.value }))}
              />
              <div className="flex justify-end gap-2 border-t border-[#dfdfdf] pt-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="rounded-sm border border-gray-300 px-4 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-sm bg-[#1a6d7e] px-5 py-1.5 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-60"
                >
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="border-b border-[#dfdfdf] bg-[#f3f3f3] px-5 py-3">
                <h3 className="text-sm font-bold text-[#333]">{announcement?.title}</h3>
                <div className="mt-1 text-[11px] text-gray-500">{formatDate(announcement?.createdAt)}</div>
              </div>
              <div className="min-h-[100px] whitespace-pre-wrap px-5 py-4 text-xs leading-6 text-gray-700">
                {announcement?.content}
              </div>
              <div className="flex justify-between border-t border-[#dfdfdf] px-5 py-3">
                {isInstructor ? (
                  <button
                    onClick={handleDelete}
                    className="rounded-sm border border-red-200 px-3 py-1 text-xs text-red-500 hover:bg-red-50"
                  >
                    삭제
                  </button>
                ) : <span />}
                <div className="flex gap-2">
                  <Link
                    to={listPath}
                    className="rounded-sm border border-gray-300 px-4 py-1 text-xs text-gray-600 hover:bg-gray-50"
                  >
                    목록
                  </Link>
                  {isInstructor && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="rounded-sm border border-[#1a6d7e]/40 px-4 py-1 text-xs font-bold text-[#1a6d7e] hover:bg-teal-50"
                    >
                      수정
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 댓글 */}
        <div className="mt-4 overflow-hidden rounded border border-[#d3d3d3] bg-white">
          <div className="border-b border-[#dfdfdf] bg-[#f3f3f3] px-4 py-2 text-xs font-bold text-gray-600">
            댓글 ({comments.length})
          </div>

          {comments.length > 0 && (
            <ul className="divide-y divide-[#efefef]">
              {comments.map((c) => (
                <li key={c.id} className="px-4 py-3">
                  {editingCommentId === c.id ? (
                    <div className="flex gap-2">
                      <input
                        className="h-7 flex-1 border border-[#d6d6d6] px-2 text-xs focus:border-[#1a6d7e] focus:outline-none"
                        value={editCommentText}
                        onChange={(e) => setEditCommentText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateComment(c.id)}
                      />
                      <button
                        onClick={() => handleUpdateComment(c.id)}
                        className="rounded-sm bg-[#1a6d7e] px-3 py-1 text-[11px] font-bold text-white"
                      >
                        저장
                      </button>
                      <button
                        onClick={() => setEditingCommentId(null)}
                        className="rounded-sm border border-gray-300 px-3 py-1 text-[11px] text-gray-500"
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="mr-2 text-[11px] font-bold text-gray-600">
                          {c.authorName ?? '사용자'}
                        </span>
                        <span className="text-xs text-gray-700">{c.content}</span>
                        <span className="ml-2 text-[10px] text-gray-400">{formatDate(c.createdAt)}</span>
                      </div>
                      {(c.authorId === user?.id || isInstructor) && (
                        <div className="flex shrink-0 gap-2">
                          {c.authorId === user?.id && (
                            <button
                              onClick={() => { setEditingCommentId(c.id); setEditCommentText(c.content); }}
                              className="text-[10px] text-gray-400 hover:text-[#1a6d7e]"
                            >
                              수정
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteComment(c.id)}
                            className="text-[10px] text-gray-400 hover:text-red-400"
                          >
                            삭제
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="flex gap-2 border-t border-[#dfdfdf] px-4 py-3">
            <input
              className="h-7 flex-1 border border-[#d6d6d6] px-2 text-xs focus:border-[#1a6d7e] focus:outline-none"
              placeholder="댓글을 입력하세요"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
            />
            <button
              onClick={handlePostComment}
              disabled={postingComment}
              className="rounded-sm bg-[#1a6d7e] px-4 py-1 text-[11px] font-bold text-white hover:bg-teal-800 disabled:opacity-60"
            >
              {postingComment ? '...' : '댓글'}
            </button>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};
