'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { BinderListItem } from '$shared/binders';
import { BinderCard } from '@/lib/components/BinderCard';
import { CreateEditBinderModal } from '@/lib/components/CreateEditBinderModal';
import { createBinder } from '@/lib/api/binders';
import styles from './BindersView.module.css';

interface Props {
  initialBinders: BinderListItem[];
}

export function BindersView({ initialBinders }: Props) {
  const router = useRouter();
  const [binders, setBinders] = useState(initialBinders);
  const [showCreate, setShowCreate] = useState(false);

  async function handleCreate(data: { name: string; icon: string; gridCols: number; gridRows: number }) {
    const newBinder = await createBinder(data);
    setBinders((prev) => [
      {
        id: newBinder.id,
        name: newBinder.name,
        icon: newBinder.icon,
        gridCols: newBinder.gridCols,
        gridRows: newBinder.gridRows,
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.heading}>Binders</h1>
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
        <ul className={styles.list}>
          {binders.map((b) => (
            <li key={b.id}>
              <BinderCard
                binder={b}
                onClick={() => router.push(`/binders/${b.id}`)}
              />
            </li>
          ))}
        </ul>
      )}

      {showCreate && (
        <CreateEditBinderModal
          onSave={handleCreate}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}
