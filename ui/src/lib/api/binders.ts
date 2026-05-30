import type {
  Binder,
  BinderListItem,
  CreateBinderBody,
  UpdateBinderBody,
  PlaceCardBody,
  MoveCardBody,
  CopyCardBody,
} from '$shared/binders';

// ── Binders ───────────────────────────────────────────────────────────────────

export async function listBinders(): Promise<BinderListItem[]> {
  const res = await fetch('/api/binders', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch binders');
  const body = await res.json() as { binders: BinderListItem[] };
  return body.binders;
}

export async function createBinder(data: CreateBinderBody): Promise<Binder> {
  const res = await fetch('/api/binders', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json() as { error: string };
    throw new Error(err.error ?? 'Failed to create binder');
  }
  const body = await res.json() as { binder: Binder };
  return body.binder;
}

export async function getBinder(id: string): Promise<Binder> {
  const res = await fetch(`/api/binders/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Binder not found');
  const body = await res.json() as { binder: Binder };
  return body.binder;
}

export async function updateBinder(id: string, data: UpdateBinderBody): Promise<Binder> {
  const res = await fetch(`/api/binders/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json() as { error: string };
    throw new Error(err.error ?? 'Failed to update binder');
  }
  const body = await res.json() as { binder: Binder };
  return body.binder;
}

export async function deleteBinder(id: string): Promise<void> {
  const res = await fetch(`/api/binders/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete binder');
}

// ── Pages ─────────────────────────────────────────────────────────────────────

export async function addPage(binderId: string): Promise<{ id: string; pageNumber: number }> {
  const res = await fetch(`/api/binders/${binderId}/pages`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to add page');
  const body = await res.json() as { page: { id: string; pageNumber: number } };
  return body.page;
}

export async function removePage(binderId: string, pageId: string): Promise<void> {
  const res = await fetch(`/api/binders/${binderId}/pages/${pageId}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json() as { error: string };
    throw new Error(err.error ?? 'Failed to remove page');
  }
}

// ── Slots ─────────────────────────────────────────────────────────────────────

export async function placeCard(
  binderId: string,
  pageId: string,
  slotIndex: number,
  data: PlaceCardBody
): Promise<void> {
  const res = await fetch(`/api/binders/${binderId}/pages/${pageId}/slots/${slotIndex}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to place card');
}

export async function clearSlot(binderId: string, pageId: string, slotIndex: number): Promise<void> {
  const res = await fetch(`/api/binders/${binderId}/pages/${pageId}/slots/${slotIndex}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to clear slot');
}

export async function moveCard(
  binderId: string,
  pageId: string,
  slotIndex: number,
  data: MoveCardBody
): Promise<void> {
  const res = await fetch(`/api/binders/${binderId}/pages/${pageId}/slots/${slotIndex}/move`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to move card');
}

export async function copyCard(
  binderId: string,
  pageId: string,
  slotIndex: number,
  data: CopyCardBody
): Promise<void> {
  const res = await fetch(`/api/binders/${binderId}/pages/${pageId}/slots/${slotIndex}/copy`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to copy card');
}
