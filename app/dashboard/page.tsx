import { getAllAttendees } from "@/app/actions/getUsers";
import StatusButtons from "@/components/StatusButtons";

export default async function Dashboard() {
    const result = await getAllAttendees();
    const attendees = result.data || [];

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-center">Admin Dashboard</h1>

            {result.error && (
                <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
                    {result.error}
                </div>
            )}

            <div className="grid gap-6">
                {attendees.length === 0 ? (
                    <p className="text-center text-gray-500">No attendees found.</p>
                ) : (
                    <div className="overflow-x-auto shadow-md sm:rounded-lg">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3">Name</th>
                                    <th className="px-6 py-3">Email</th>
                                    <th className="px-6 py-3">Idea</th>
                                    <th className="px-6 py-3">Approved</th>
                                    <th className="px-6 py-3">Rejected</th>
                                    <th className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendees.map((person: any) => (
                                    <tr key={person.userId} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">{person.name}</td>
                                        <td className="px-6 py-4">{person.email}</td>
                                        <td className="px-6 py-4">{person.idea}</td>
                                        <td className="px-6 py-4">
                                            <StatusButtons userId={person.userId} color={"green"} status={"approved"} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusButtons userId={person.userId} color={"red"} status={"rejected"} />
                                        </td>
                                        <td className="px-6 py-4">{person.approved}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}