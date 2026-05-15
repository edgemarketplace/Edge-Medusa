'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { SiteData, GeneratedSection, PageData, SectionType, TemplateFamily } from '@/lib/types';
import { TEMPLATES } from '@/lib/templates';
import { SECTION_LIBRARY, SECTION_CATEGORIES } from '@/lib/section-library';
import SectionEditor from '@/components/SectionEditor';
import SectionPreview from '@/components/SectionPreview';

interface PageEditorProps {
  params: Promise<{ siteId: string; pageId: string }>;
}

function genId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export default function PageEditor({ params }: PageEditorProps) {
  const [siteId, setSiteId] = useState<string>('');
  const [pageId, setPageId] = useState<string>('');
  const [site, setSite] = useState<SiteData | null>(null);
  const [page, setPage] = useState<PageData | null>(null);
  const [sections, setSections] = useState<GeneratedSection[]>([]);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<GeneratedSection | null>(null);
  const [savingSection, setSavingSection] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState<number | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    params.then(({ siteId, pageId }) => {
      setSiteId(siteId);
      setPageId(pageId);
    });
  }, [params]);

  useEffect(() => {
    if (!siteId || !pageId) return;
    loadData();
  }, [siteId, pageId]);

  async function loadData() {
    try {
      const [siteRes, pageRes] = await Promise.all([
        fetch(`/api/sites/${siteId}`),
        fetch(`/api/sites/${siteId}/pages/${pageId}`),
      ]);
      if (siteRes.ok) setSite(await siteRes.json());
      if (pageRes.ok) {
        const pageData = await pageRes.json();
        setPage(pageData);
        setSections(pageData.sections || []);
      }
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleSaveSections(updated: GeneratedSection[]) {
    if (!siteId || !pageId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/sites/${siteId}/pages/${pageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: updated }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setSections(updated);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function addSection(type: SectionType, afterIndex: number) {
    const def = SECTION_LIBRARY[type];
    if (!def) return;
    const newSection: GeneratedSection = { id: genId(), type, data: { ...def.defaultData } };
    const updated = [...sections];
    updated.splice(afterIndex + 1, 0, newSection);
    setSections(updated);
    handleSaveSections(updated);
    setShowAddMenu(null);
  }

  function removeSection(id: string) {
    const updated = sections.filter(s => s.id !== id);
    setSections(updated);
    handleSaveSections(updated);
    if (editingId === id) { setEditingId(null); setEditDraft(null); }
  }

  function moveSection(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    const updated = [...sections];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    setSections(updated);
    handleSaveSections(updated);
  }

  function startEditing(id: string) {
    const section = sections.find(s => s.id === id);
    if (!section) return;
    setEditingId(id);
    setEditDraft({ ...section, data: { ...section.data } });
  }

  function cancelEditing() { setEditingId(null); setEditDraft(null); }

  async function saveEditing() {
    if (!editingId || !editDraft) return;
    setSavingSection(true);
    const updated = sections.map(s => s.id === editingId ? editDraft : s);
    await handleSaveSections(updated);
    setEditingId(null);
    setEditDraft(null);
    setSavingSection(false);
  }

  function updateDraftData(field: string, value: any) {
    if (!editDraft) return;
    setEditDraft({ ...editDraft, data: { ...editDraft.data, [field]: value } });
  }

  if (!site || !page) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-black border-t-transparent rounded-full" />
      </div>
    );
  }

  const template = TEMPLATES[site.business_type as TemplateFamily];

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#1A1A1A]">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-black/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/build/${siteId}`} className="text-sm text-black/60 hover:text-black font-medium">
            ← Back to {site.business_name}
          </Link>
          <span className="text-black/20">|</span>
          <span className="font-bold">{page.title}</span>
          {saving && <span className="text-xs text-black/40 ml-2">Saving...</span>}
        </div>
        <div className="flex items-center gap-3">
          {site.subdomain ? (
            <a href={`https://${site.subdomain}.edgemarketplacehub.com/${page.slug}`} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-full border border-black/10 text-sm font-bold hover:bg-black/5">
              Preview live
            </a>
          ) : (
            <span className="px-4 py-2 rounded-full border border-black/10 text-sm text-black/40" title="Launch your site to get a live URL">
              Preview (launch first)
            </span>
          )}
        </div>
      </div>

      <div className="flex">
        {/* Left rail */}
        <div className="w-64 shrink-0 border-r border-black/5 bg-white min-h-[calc(100vh-64px)] overflow-y-auto sticky top-[64px]">
          <div className="p-4">
            <h3 className="text-xs font-bold text-black/40 uppercase tracking-wider mb-3">Add sections</h3>
            <div className="space-y-1">
              {SECTION_CATEGORIES.map(cat => (
                <div key={cat.category}>
                  <button
                    onClick={() => setExpandedCategory(expandedCategory === cat.category ? null : cat.category)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-black/5 text-sm font-medium text-left"
                    aria-expanded={expandedCategory === cat.category}
                  >
                    <span>{cat.icon}</span>
                    <span className="flex-1">{cat.label}</span>
                    <span className="text-black/30 text-xs">{expandedCategory === cat.category ? '−' : '+'}</span>
                  </button>
                  {expandedCategory === cat.category && (
                    <div className="ml-4 mt-1 space-y-0.5">
                      {cat.types.map(type => {
                        const def = SECTION_LIBRARY[type];
                        return (
                          <button
                            key={type}
                            onClick={() => { addSection(type, sections.length - 1); setExpandedCategory(null); }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-black/5 text-xs text-left text-black/70"
                          >
                            <span>{def.icon}</span>
                            <span>{def.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-red-700 text-sm mb-4">
              {error}
            </div>
          )}

          {sections.length === 0 && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <p className="text-black/40 mb-4">This page has no sections yet</p>
                <p className="text-sm text-black/30">Use the left rail to add sections to this page</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {sections.map((section, i) => {
              const def = SECTION_LIBRARY[section.type];
              const isEditing = editingId === section.id;
              return (
                <div key={section.id}>
                  <div className={`bg-white border rounded-2xl overflow-hidden transition-all ${isEditing ? 'border-black/30 shadow-lg' : 'border-black/5 hover:border-black/15'}`}>
                    <div className="flex items-center justify-between px-3 py-1.5 border-b border-black/5 bg-[#FAFAF9]">
                      <span className="text-xs font-bold text-black/30 uppercase tracking-wider">{def?.icon} {def?.label || section.type}</span>
                      <div className="flex items-center gap-0.5">
                        {isEditing ? (
                          <>
                            <button onClick={saveEditing} disabled={savingSection} className="px-2.5 py-1 rounded-full bg-black text-white text-xs font-bold disabled:opacity-50">
                              {savingSection ? '...' : '✓ Save'}
                            </button>
                            <button onClick={cancelEditing} className="px-2.5 py-1 rounded-full border border-black/10 text-xs font-bold hover:bg-black/5">Cancel</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => moveSection(i, -1)} disabled={i === 0} className="p-1 rounded hover:bg-black/5 text-black/40 disabled:opacity-30 text-xs" aria-label="Move up">↑</button>
                            <button onClick={() => moveSection(i, 1)} disabled={i === sections.length - 1} className="p-1 rounded hover:bg-black/5 text-black/40 disabled:opacity-30 text-xs" aria-label="Move down">↓</button>
                            <button onClick={() => startEditing(section.id)} className="px-2.5 py-1 rounded-full border border-black/10 text-xs font-bold hover:bg-black/5">Edit</button>
                            <button onClick={() => removeSection(section.id)} className="p-1 rounded hover:bg-red-50 text-black/40 hover:text-red-600 text-xs" aria-label="Remove">✕</button>
                          </>
                        )}
                      </div>
                    </div>
                    {isEditing && editDraft ? (
                      <SectionEditor draft={editDraft} onChange={updateDraftData} siteId={siteId} businessType={site.business_type} />
                    ) : (
                      <SectionPreview section={section} template={template} />
                    )}
                  </div>
                  <div className="flex justify-center py-1 relative">
                    <button onClick={() => setShowAddMenu(showAddMenu === i ? null : i)} className="px-3 py-1 rounded-full border border-dashed border-black/15 text-[10px] text-black/30 hover:text-black/60 hover:border-black/30">
                      + Add section
                    </button>
                    {showAddMenu === i && (
                      <div className="absolute top-full mt-1 bg-white border border-black/10 rounded-xl shadow-xl p-2 z-10 max-h-64 overflow-y-auto">
                        {SECTION_CATEGORIES.map(cat => (
                          <div key={cat.category}>
                            <p className="text-[10px] font-bold text-black/30 uppercase tracking-wider px-2 py-1">{cat.label}</p>
                            {cat.types.map(type => {
                              const d = SECTION_LIBRARY[type];
                              return (
                                <button key={type} onClick={() => addSection(type, i)} className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-black/5 text-xs flex items-center gap-1.5">
                                  <span>{d.icon}</span> {d.label}
                                </button>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
