'use client';

import { useState, useEffect, useCallback } from 'react';

export default function MealHistoryPage() {
    const [meals, setMeals] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
    const [selectedMember, setSelectedMember] = useState('');

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const res = await fetch('/api/members');
                const data = await res.json();
                if (data.success) setMembers(data.data);
            } catch (error) {
                console.error('Error fetching members:', error);
            }
        };
        fetchMembers();
    }, []);

    const fetchMeals = useCallback(async () => {
        setLoading(true);
        try {
            let url = `/api/meals?month=${month}`;
            if (selectedMember) {
                url += `&memberId=${selectedMember}`;
            }
            const res = await fetch(url);
            const data = await res.json();
            if (data.success) {
                setMeals(data.data);
            }
        } catch (error) {
            console.error('Error fetching meals:', error);
        } finally {
            setLoading(false);
        }
    }, [month, selectedMember]);

    useEffect(() => {
        fetchMeals();
    }, [fetchMeals]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-3xl font-bold text-primary">Meal History</h1>
                <div className="flex gap-2">
                    <select
                        value={selectedMember}
                        onChange={(e) => setSelectedMember(e.target.value)}
                        className="rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                    >
                        <option value="">All Members</option>
                        {members.map((m) => (
                            <option key={m._id} value={m._id}>
                                {m.name}
                            </option>
                        ))}
                    </select>
                    <input
                        type="month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                </div>
            </div>

            <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-6 py-3 font-medium">Date</th>
                                <th className="px-6 py-3 font-medium">Member</th>
                                <th className="px-6 py-3 font-medium text-right">Count</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan="3" className="p-4 text-center">Loading...</td></tr>
                            ) : meals.length === 0 ? (
                                <tr><td colSpan="3" className="p-4 text-center text-muted-foreground">No meals found for this month.</td></tr>
                            ) : (
                                meals.map((meal) => (
                                    <tr key={meal._id} className="hover:bg-muted/10">
                                        <td className="px-6 py-4">{new Date(meal.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 font-medium">{meal.memberId?.name || 'Unknown'}</td>
                                        <td className="px-6 py-4 text-right">{meal.count}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
