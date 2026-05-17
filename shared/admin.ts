export type AdminStats = {
  totalUsers: number;
  totalCollectionEntries: number;
  totalChaseCards: number;
  totalCachedCards: number;
};

export type AdminUser = {
  id: string;
  email: string;
  displayName: string | null;
  isAdmin: boolean;
  createdAt: string;
  collectionCount: number;
  chaseCount: number;
};

export type AdminUserDetail = AdminUser;

export type AdminCollectionEntry = {
  id: string;
  cardId: string;
  language: string;
  quantity: number;
  addedAt: string;
};

export type AdminChaseEntry = {
  id: string;
  cardId: string;
  cardSnapshot: {
    name: string;
    setName: string;
    setId: string;
    imageSmall: string;
  };
  addedAt: string;
};

export type AdminCacheEntry = {
  cardId: string;
  fetchedAt: string;
};

export type AdminCacheStats = {
  total: number;
  entries: AdminCacheEntry[];
};

export type AdminUsersResponse = {
  users: AdminUser[];
  total: number;
};
