import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { type Group } from '@/lib/services/group.service';

export const useGroups = (userId: string | null) => {
    const queryClient = useQueryClient();
    const supabase = createClient();

    const fetchGroups = async (): Promise<Group[]> => {
        if (!userId) return [];
        const { data, error } = await supabase
            .from('groups')
            .select('*')
            .eq('owner_id', userId);
        if (error) throw error;
        return data as Group[];
    };

    const groupsQuery = useQuery({
        queryKey: ['groups', userId],
        queryFn: fetchGroups,
        enabled: !!userId,
        staleTime: 1000 * 60, // 1 minute
    });

    const addGroupMutation = useMutation({
        mutationFn: async (newGroup: Partial<Group>) => {
            const { data, error } = await supabase.from('groups').insert(newGroup as any).select().single();
            if (error) throw error;
            return data as Group;
        },
        onSuccess: (group) => {
            queryClient.setQueryData(['groups', userId], (old: Group[] | undefined) => {
                return old ? [...old, group] : [group];
            });
        },
    });

    return { ...groupsQuery, addGroupMutation };
};
