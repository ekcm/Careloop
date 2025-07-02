import { createGroup, deleteGroup, getGroupDetails, getGroupMembers, getUserProfile, Group, GroupMember, joinGroupByName, leaveOrBeKickedFromGroup, supabase } from '@/apis/supabaseApi';
import { FC, useCallback, useEffect, useState } from 'react';

export const UserPage: FC<{
  session: any;
  handleLogout: () => void;
  loading: boolean;
}> = ({ session, handleLogout, loading }) => {
  const [displayName, setDisplayName] = useState(session.user.user_metadata.display_name || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoadingGroupInfo, setIsLoadingGroupInfo] = useState(true);
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [view, setView] = useState<'idle' | 'create' | 'join'>('idle');
  const [newGroupName, setNewGroupName] = useState('');
  const [joinGroupName, setJoinGroupName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

   /**
   * Fetches the user's profile and, if applicable, their group details and members.
   */
  const fetchGroupData = useCallback(async () => {
    setIsLoadingGroupInfo(true);
    try {
      const userProfile = await getUserProfile(session.user.id);

      if (userProfile?.group_id) {
        const groupDetails = await getGroupDetails(userProfile.group_id);
        if (groupDetails) {
          const groupMembers = await getGroupMembers(groupDetails.id);
          setGroup(groupDetails);
          setMembers(groupMembers);
        }
      } else {
        setGroup(null);
        setMembers([]);
      }
    } catch (error) {
      console.error("Error fetching group data:", error);
    } finally {
      setIsLoadingGroupInfo(false);
    }
  }, [session.user.id]);

  useEffect(() => {
    fetchGroupData();
  }, [fetchGroupData]);


  const handleUpdateName = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { display_name: displayName },
      });
      if (error) throw error;
      setIsEditing(false);
    } catch (error) {
        console.error("Error updating display name:", error);
    }
    finally {
      setIsUpdating(false);
    }
  };

    /**
   * Creates a new group, joins it, and refreshes the UI.
   */
    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) {
          alert('Group name cannot be empty.');
          return;
        }
        setIsSubmitting(true);
        try {
            console.log('NAME', newGroupName)
            console.log('USERID', session.user.id)
          const newGroup = await createGroup(newGroupName, session.user.id);
          await joinGroupByName(session.user.id, newGroup.name);
          await fetchGroupData(); // Refresh data to show the new group
          setView('idle');
          setNewGroupName('');
        } catch (error) {
          console.error("Failed to create group:", error);
          alert("Failed to create group.");
        } finally {
          setIsSubmitting(false);
        }
      };

  /**
   * Joins an existing group and refreshes the UI.
   */
  const handleJoinGroup = async () => {
    if (!joinGroupName.trim()) {
      alert('Group ID cannot be empty.');
      return;
    }
    setIsSubmitting(true);
    try {
      await joinGroupByName(session.user.id, joinGroupName);
      await fetchGroupData(); // Refresh data to show the new group
      setView('idle');
      setJoinGroupName('');
    } catch (error) {
      console.error("Failed to join group:", error);
      alert("Failed to join group. Please check the ID and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

    /**
   * Allows a user to leave their current group.
   */
    const handleLeaveGroup = async () => {
        if (window.confirm('Are you sure you want to leave this group?')) {
          setIsSubmitting(true);
          try {
            await leaveOrBeKickedFromGroup(session.user.id);
            await fetchGroupData(); // Refresh data; group will now be null
          } catch (error) {
            console.error("Failed to leave group:", error);
            alert("Failed to leave the group.");
          } finally {
            setIsSubmitting(false);
          }
        }
      };

        /**
   * Allows a group admin to delete the entire group.
   */
  const handleDeleteGroup = async () => {
    if (window.confirm('Are you sure you want to DELETE this group for everyone? This action cannot be undone.')) {
      if (!group) return;
      setIsSubmitting(true);
      try {
        await deleteGroup(group.id);
        await fetchGroupData(); // Refresh data; group will now be null
      } catch (error) {
        console.error("Failed to delete group:", error);
        alert("Failed to delete the group.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

 /**
   * Renders the group information section based on the fetched data and current view.
   */
  const renderGroupSection = () => {
    if (isLoadingGroupInfo) {
      return <div className="text-gray-500 border-t pt-4 mt-4">Loading group info...</div>;
    }

    // --- VIEW WHEN USER IS IN A GROUP ---
    if (group) {
        const isAdmin = session.user.id === group.admin_id;
        return (
          <div className="border-t pt-4 mt-4 space-y-2">
            <div>
              <span className="font-medium">My Group:</span> {group.name}
            </div>
            <div>
              <span className="font-medium">My Role:</span> {isAdmin ? 'Admin 👑' : 'Member'}
            </div>
            <div>
              <span className="font-medium">Group Members:</span>
              <ul className="list-disc list-inside ml-2 text-gray-700">
                  {members.map(member => (
                      <li key={member.id}>{member.display_name || 'New Member'}</li>
                  ))}
              </ul>
            </div>
            {/* Leave or Delete Group Button Section */}
            <div className="pt-2">
              {isAdmin ? (
                  <button onClick={handleDeleteGroup} disabled={isSubmitting} className="text-red-600 border border-red-600 px-3 py-1 rounded text-xs hover:bg-red-50 disabled:opacity-50">
                      {isSubmitting ? 'Deleting...' : 'Delete Group'}
                  </button>
              ) : (
                  <button onClick={handleLeaveGroup} disabled={isSubmitting} className="text-red-600 border border-red-600 px-3 py-1 rounded text-xs hover:bg-red-50 disabled:opacity-50">
                      {isSubmitting ? 'Leaving...' : 'Leave Group'}
                  </button>
              )}
            </div>
          </div>
        );
      }

    // --- VIEWS WHEN USER IS NOT IN A GROUP ---

    // CREATE GROUP VIEW
    if (view === 'create') {
        return (
            <div className="border-t pt-4 mt-4 space-y-2">
                <h3 className="font-medium">Create a New Group</h3>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        placeholder="Enter group name"
                        className="border px-2 py-1 rounded text-sm flex-grow"
                    />
                    <button onClick={handleCreateGroup} disabled={isSubmitting} className="text-white bg-blue-600 px-3 py-1 rounded text-xs hover:bg-blue-700 disabled:opacity-50">
                        {isSubmitting ? '...' : 'Create'}
                    </button>
                </div>
                 <button onClick={() => setView('idle')} className="text-gray-500 text-xs hover:underline">Cancel</button>
            </div>
        );
    }

    // JOIN GROUP VIEW
    if (view === 'join') {
        return (
            <div className="border-t pt-4 mt-4 space-y-2">
                <h3 className="font-medium">Join an Existing Group</h3>
                 <div className="flex gap-2">
                    <input
                        type="text"
                        value={joinGroupName}
                        onChange={(e) => setJoinGroupName(e.target.value)}
                        placeholder="Paste group ID"
                        className="border px-2 py-1 rounded text-sm flex-grow"
                    />
                    <button onClick={handleJoinGroup} disabled={isSubmitting} className="text-white bg-green-600 px-3 py-1 rounded text-xs hover:bg-green-700 disabled:opacity-50">
                        {isSubmitting ? '...' : 'Join'}
                    </button>
                </div>
                <button onClick={() => setView('idle')} className="text-gray-500 text-xs hover:underline">Cancel</button>
            </div>
        );
    }

    // IDLE VIEW (DEFAULT)
    return (
        <div className="border-t pt-4 mt-4 space-y-2">
            <p className="text-gray-600">You are not in a group yet.</p>
            <div className="flex gap-2">
                <button onClick={() => setView('create')} className="text-white bg-blue-600 px-3 py-1 rounded text-xs hover:bg-blue-700">Create a Group</button>
                <button onClick={() => setView('join')} className="text-blue-600 border border-blue-600 px-3 py-1 rounded text-xs hover:bg-blue-50">Join a Group</button>
            </div>
        </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 p-6 max-w-md mx-auto text-sm bg-white shadow-md rounded-lg">
      {/* Display Name Section */}
      <div className="flex items-center gap-2">
        <span className="font-medium">Display Name:</span>
        {isEditing ? (
          <>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="border px-2 py-1 rounded text-sm flex-grow"
            />
            <button
              onClick={handleUpdateName}
              disabled={isUpdating || loading}
              className="text-blue-600 border border-blue-600 px-2 py-1 rounded text-xs hover:bg-blue-50 disabled:opacity-50"
            >
              {isUpdating ? '...' : 'Save'}
            </button>
          </>
        ) : (
          <>
            <span>{displayName || 'Not set'}</span>
            <button
              onClick={() => setIsEditing(true)}
              className="text-blue-600 text-xs border px-2 py-1 rounded hover:bg-blue-50"
            >
              Edit
            </button>
          </>
        )}
      </div>

      {/* Email Display */}
      <div>
        <span className="font-medium">Email:</span>{' '}
        <span>{session.user.email}</span>
      </div>

      {/* Render the dynamic group section */}
      {renderGroupSection()}

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        disabled={loading}
        className="text-red-600 border border-red-600 px-3 py-1 rounded text-xs mt-2 hover:bg-red-50 disabled:opacity-50 self-start"
      >
        {loading ? 'Logging out...' : 'Log Out'}
      </button>
    </div>
  );
};