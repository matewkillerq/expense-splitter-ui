import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export interface Expense {
    id: string;
    title: string;
    amount: number;
    paidBy: string[];
    participants: string[];
    date: string;
}

export const useExpenses = (groupId: string | null) => {
    const queryClient = useQueryClient();
    const supabase = createClient();

    const fetchExpenses = async (): Promise<Expense[]> => {
        if (!groupId) return [];
        const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .eq('group_id', groupId);
        if (error) throw error;
        return data as Expense[];
    };

    const expensesQuery = useQuery({
        queryKey: ['expenses', groupId],
        queryFn: fetchExpenses,
        enabled: !!groupId,
        staleTime: 1000 * 30, // 30 seconds
    });

    const deleteExpenseMutation = useMutation({
        mutationFn: async (expenseId: string) => {
            const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
            if (error) throw error;
            return expenseId;
        },
        onSuccess: (deletedId) => {
            queryClient.setQueryData(['expenses', groupId], (old: Expense[] | undefined) => {
                return old ? old.filter((e) => e.id !== deletedId) : [];
            });
        },
    });

    return { ...expensesQuery, deleteExpenseMutation };
};
