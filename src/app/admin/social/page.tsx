"use client";

import { useEffect, useState } from "react";

type SocialPost = {
  id: string;
  post_type: string;
  context_notes?: string;
  generated_content?: string;
  status: string;
  scheduled_at?: string;
  posted_at?: string;
  fb_post_id?: string;
  fb_post_url?: string;
  revision_notes?: string;
  created_at: string;
  updated_at: string;
};

const POST_TYPES = [
  "Educational Tip",
  "Service Offer",
  "Job Story",
  "Seasonal",
  "Promo",
  "Other",
];

const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-700",
  Approved: "bg-green-100 text-green-700",
  Posted: "bg-blue-100 text-blue-700",
  Denied: "bg-red-100 text-red-700",
  "Needs Revision": "bg-yellow-100 text-yellow-700",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
      {type}
    </span>
  );
}

function formatDt(dt?: string) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

export default function SocialPage() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [editPost, setEditPost] = useState<SocialPost | null>(null);
  const [viewPost, setViewPost] = useState<SocialPost | null>(null);

  // New post form state
  const [newType, setNewType] = useState("Educational Tip");
  const [newScheduled, setNewScheduled] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Edit state
  const [editContent, setEditContent] = useState("");
  const [editScheduled, setEditScheduled] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editRevision, setEditRevision] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const fetchPosts = async () => {
    const res = await fetch("/api/admin/social");
    if (res.ok) {
      const data = await res.json();
      setPosts(data);
    }
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleSaveDraft = async () => {
    setSaving(true);
    await fetch("/api/admin/social", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        post_type: newType,
        scheduled_at: newScheduled || null,
        context_notes: newNotes,
      }),
    });
    setShowNew(false);
    setNewType("Educational Tip");
    setNewScheduled("");
    setNewNotes("");
    setSaving(false);
    await fetchPosts();
  };

  const openEdit = (post: SocialPost) => {
    setEditPost(post);
    setEditContent(post.generated_content || "");
    setEditScheduled(post.scheduled_at ? post.scheduled_at.slice(0, 16) : "");
    setEditStatus(post.status);
    setEditRevision(post.revision_notes || "");
  };

  const handleUpdate = async (overrides?: Partial<SocialPost>) => {
    if (!editPost) return;
    setEditSaving(true);
    const body: Record<string, string | null> = {
      generated_content: editContent,
      scheduled_at: editScheduled || null,
      status: overrides?.status || editStatus,
      revision_notes: editRevision || null,
    };
    await fetch(`/api/admin/social/${editPost.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setEditPost(null);
    setEditSaving(false);
    await fetchPosts();
  };

  const quickUpdate = async (id: string, data: Partial<SocialPost>) => {
    await fetch(`/api/admin/social/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await fetchPosts();
  };

  const drafts = posts.filter((p) => p.status === "Draft" || p.status === "Needs Revision");
  const approved = posts.filter((p) => p.status === "Approved");
  const posted = posts.filter((p) => p.status === "Posted" || p.status === "Denied");

  if (loading) {
    return <div className="flex items-center justify-center h-40 text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">📣 Social Media</h1>
        <button
          onClick={() => setShowNew(!showNew)}
          className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
        >
          {showNew ? "✕ Cancel" : "+ New Post"}
        </button>
      </div>

      {/* New Post Form */}
      {showNew && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
          <h2 className="font-semibold text-navy text-lg">New Social Post</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Post Type</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                {POST_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date & Time</label>
              <input
                type="datetime-local"
                value={newScheduled}
                onChange={(e) => setNewScheduled(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Context Notes</label>
            <textarea
              rows={4}
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Give me the details — what happened, what was fixed, what's the offer, etc."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-y"
            />
          </div>
          <p className="text-xs text-gray-500">
            💡 Content generation happens in Discord. Save a draft here to capture the context, then paste the generated content in when it&apos;s ready.
          </p>
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="bg-navy text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-navy-light transition-colors disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Draft"}
          </button>
        </div>
      )}

      {/* Approval Queue */}
      <section>
        <h2 className="text-lg font-semibold text-navy mb-3">
          ✅ Approval Queue
          {approved.length > 0 && (
            <span className="ml-2 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">{approved.length}</span>
          )}
        </h2>
        {approved.length === 0 ? (
          <p className="text-gray-400 text-sm">No posts awaiting approval.</p>
        ) : (
          <div className="grid gap-4">
            {approved.map((post) => (
              <div key={post.id} className="bg-white rounded-xl border border-green-200 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <TypeBadge type={post.post_type} />
                    <StatusBadge status={post.status} />
                    {post.scheduled_at && (
                      <span className="text-xs text-gray-500">🕐 {formatDt(post.scheduled_at)}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setViewPost(post)} className="text-xs text-blue-600 hover:underline">View Full</button>
                    <button onClick={() => openEdit(post)} className="text-xs text-amber-600 hover:underline">Edit</button>
                    <button onClick={() => quickUpdate(post.id, { status: "Denied" })} className="text-xs text-red-500 hover:underline">Deny</button>
                  </div>
                </div>
                {post.generated_content && (
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                    {post.generated_content.slice(0, 150)}{post.generated_content.length > 150 ? "…" : ""}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Drafts */}
      <section>
        <h2 className="text-lg font-semibold text-navy mb-3">
          📝 Drafts
          {drafts.length > 0 && (
            <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{drafts.length}</span>
          )}
        </h2>
        {drafts.length === 0 ? (
          <p className="text-gray-400 text-sm">No drafts.</p>
        ) : (
          <div className="grid gap-4">
            {drafts.map((post) => (
              <div key={post.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <TypeBadge type={post.post_type} />
                    <StatusBadge status={post.status} />
                    <span className="text-xs text-gray-400">Created {formatDt(post.created_at)}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(post)} className="text-xs text-amber-600 hover:underline">Edit</button>
                    <button
                      onClick={() => quickUpdate(post.id, { status: "Approved" })}
                      className="text-xs text-green-600 hover:underline"
                    >
                      Approve
                    </button>
                    <button onClick={() => quickUpdate(post.id, { status: "Denied" })} className="text-xs text-red-500 hover:underline">Deny</button>
                  </div>
                </div>
                {post.context_notes && (
                  <p className="mt-2 text-sm text-gray-500">
                    <span className="font-medium">Notes:</span> {post.context_notes.slice(0, 120)}{post.context_notes.length > 120 ? "…" : ""}
                  </p>
                )}
                {post.revision_notes && (
                  <p className="mt-1 text-sm text-yellow-700 bg-yellow-50 rounded px-2 py-1">
                    ✏️ Revision: {post.revision_notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Posted History */}
      <section>
        <h2 className="text-lg font-semibold text-navy mb-3">📅 History</h2>
        {posted.length === 0 ? (
          <p className="text-gray-400 text-sm">No posted or denied posts yet.</p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Preview</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">FB Link</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {posted.map((post) => (
                  <tr key={post.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDt(post.posted_at || post.updated_at)}</td>
                    <td className="px-4 py-3"><TypeBadge type={post.post_type} /></td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                      {post.generated_content ? post.generated_content.slice(0, 50) + (post.generated_content.length > 50 ? "…" : "") : "—"}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {post.fb_post_url ? (
                        <a href={post.fb_post_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">
                          View →
                        </a>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={post.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* View Full Modal */}
      {viewPost && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TypeBadge type={viewPost.post_type} />
                <StatusBadge status={viewPost.status} />
              </div>
              <button onClick={() => setViewPost(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            {viewPost.scheduled_at && (
              <p className="text-sm text-gray-500 mb-3">🕐 Scheduled: {formatDt(viewPost.scheduled_at)}</p>
            )}
            {viewPost.context_notes && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Context Notes</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{viewPost.context_notes}</p>
              </div>
            )}
            {viewPost.generated_content && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Generated Content</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded p-3">{viewPost.generated_content}</p>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setViewPost(null); openEdit(viewPost); }} className="text-sm px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600">
                Edit
              </button>
              <button onClick={() => setViewPost(null)} className="text-sm px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editPost && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-navy text-lg">Edit Post</h3>
              <button onClick={() => setEditPost(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Generated Content</label>
                <textarea
                  rows={8}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Paste or write the post content here..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-y"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date & Time</label>
                  <input
                    type="datetime-local"
                    value={editScheduled}
                    onChange={(e) => setEditScheduled(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option>Draft</option>
                    <option>Approved</option>
                    <option>Needs Revision</option>
                    <option>Denied</option>
                  </select>
                </div>
              </div>
              {(editStatus === "Needs Revision") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Revision Notes</label>
                  <textarea
                    rows={2}
                    value={editRevision}
                    onChange={(e) => setEditRevision(e.target.value)}
                    placeholder="What needs to be changed?"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-2 flex-wrap mt-5">
              <button
                onClick={() => handleUpdate()}
                disabled={editSaving}
                className="px-4 py-2 bg-navy text-white rounded-lg text-sm font-medium hover:bg-navy-light disabled:opacity-60"
              >
                {editSaving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => { setEditStatus("Approved"); handleUpdate({ status: "Approved" }); }}
                disabled={editSaving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60"
              >
                Approve
              </button>
              <button
                onClick={() => { setEditStatus("Needs Revision"); }}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600"
              >
                Send for Revision
              </button>
              <button
                onClick={() => { setEditStatus("Denied"); handleUpdate({ status: "Denied" }); }}
                disabled={editSaving}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-60"
              >
                Deny
              </button>
              <button
                onClick={() => setEditPost(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 ml-auto"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
