'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { BinderListItem } from '$shared/binders';
import { BinderCard } from '@/lib/components/BinderCard';
import { CreateEditBinderModal } from '@/lib/components/CreateEditBinderModal';
import { createBinder, deleteBinder, updateBinder } from '@/lib/api/binders';
import styles from './BindersView.module.css';

interface Props {
  initialBinders: BinderListItem[];
}

export function BindersView({ initialBinders }: Props) {
  const router = useRouter();
  const [binders, setBinders] = useState(initialBinders);
  const [showCreate, setShowCreate] = useState(false);
  const [editingBinder, setEditingBinder] = useState<BinderListItem | null>(null);

  async function handleCreate(data: { name: string; icon: string; gridCols: number; gridRows: number; color: string }) {
    const newBinder = await createBinder(data);
    setBinders((prev) => [
      {
        id: newBinder.id,
        name: newBinder.name,
        icon: newBinder.icon,
        gridCols: newBinder.gridCols,
        gridRows: newBinder.gridRows,
        color: newBinder.color,
        pageCount: newBinder.pages.length,
        filledSlots: 0,
        totalSlots: newBinder.pages.length * newBinder.gridCols * newBinder.gridRows,
        estimatedValue: 0,
        createdAt: newBinder.createdAt,
        updatedAt: newBinder.updatedAt,
      },
      ...prev,
    ]);
  }

  async function handleUpdate(data: { name: string; icon: string; gridCols: number; gridRows: number; color: string }) {
    if (!editingBinder) return;
    const updated = await updateBinder(editingBinder.id, data);
    setBinders((prev) => prev.map((b) =>
      b.id === editingBinder.id
        ? { ...b, name: updated.name, icon: updated.icon, gridCols: updated.gridCols, gridRows: updated.gridRows, color: updated.color }
        : b
    ));
    setEditingBinder(null);
  }

  async function handleDelete(binderId: string, name: string) {
    if (!confirm(`Delete "${name}"? All cards inside will be lost.`)) return;
    await deleteBinder(binderId);
    setBinders((prev) => prev.filter((b) => b.id !== binderId));
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <h1 className={styles.title}>Binders</h1>
        <button
          type="button"
          className={styles.newBtn}
          onClick={() => setShowCreate(true)}
        >
          + New Binder
        </button>
      </div>

      {binders.length === 0 ? (
        <div className={styles.empty}>
          <p>No binders yet. Create your first one!</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {binders.map((b) => (
            <BinderCard
              key={b.id}
              binder={b}
              onClick={() => router.push(`/binders/${b.id}`)}
              onEdit={(e) => { e.stopPropagation(); setEditingBinder(b); }}
              onDelete={(e) => { e.stopPropagation(); void handleDelete(b.id, b.name); }}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateEditBinderModal
          onSave={handleCreate}
          onClose={() => setShowCreate(false)}
        />
      )}

      {editingBinder && (
        <CreateEditBinderModal
          binder={editingBinder}
          onSave={handleUpdate}
          onClose={() => setEditingBinder(null)}
        />
      )}
    </div>
  );
}
