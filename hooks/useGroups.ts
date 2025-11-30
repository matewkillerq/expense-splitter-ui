import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupService, type Group } from '@/lib/services/group.service';

export const useGroups = (userId: string | null) => {
    const queryClient = useQueryClient();

    const fetchGroups = async (): Promise<Group[]> => {
        if (!userId) return [];
        const { data, error } = await groupService.getUserGroups(userId);
        if (error) throw new Error(error);
        return data || [];
    };

    const groupsQuery = useQuery({
        queryKey: ['groups', userId],
        queryFn: fetchGroups,
        enabled: !!userId,
        staleTime: 1000 * 60, // 1 minute
    });

    const addGroupMutation = useMutation({
        mutationFn: async (newGroup: { name: string; emoji: string; members: string[]; currency?: any }) => {
            if (!userId) throw new Error('User ID is required');
            const { data, error } = await groupService.createGroup(userId, newGroup);
            if (error) throw new Error(error);
            if (!data) throw new Error('Failed to create group');
            return data;
        },
        onSuccess: (group) => {
            queryClient.setQueryData(['groups', userId], (old: Group[] | undefined) => {
                return old ? [...old, group] : [group];
            });
        },
    });

    return { ...groupsQuery, addGroupMutation };
};
