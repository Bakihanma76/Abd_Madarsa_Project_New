import { useEffect, useState } from 'react';
import { createResource, deleteResource, listResource, updateResource } from '../api';

type Entity = { id: number };

export const useApiResource = <T extends Entity>(resource: string) => {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await listResource<T>(resource));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [resource]);

  const save = async (id: number | undefined, data: Partial<T>) => {
    const saved = id
      ? await updateResource<T>(resource, id, data)
      : await createResource<T>(resource, data);
    setItems((current) => id
      ? current.map((item) => item.id === id ? saved : item)
      : [saved, ...current]);
    return saved;
  };

  const remove = async (id: number) => {
    await deleteResource(resource, id);
    setItems((current) => current.filter((item) => item.id !== id));
  };

  return { items, loading, error, reload: load, save, remove };
};
