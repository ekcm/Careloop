'use client';

import { FC, useCallback, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import {
  createGroup,
  deleteGroup,
  getGroupDetails,
  getGroupMembers,
  getUserProfile,
  Group,
  GroupMember,
  joinGroupByName,
  leaveOrBeKickedFromGroup,
  supabase,
} from '@/apis/supabaseApi';
import { toast } from 'sonner';
import { Loader2, Edit, Save, X, Users, Plus, LogIn } from 'lucide-react';

// --- Helper Components for Cleaner UI ---

const InfoRow: FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div className="flex items-center justify-between py-3 border-b border-slate-100">
    <p className="text-sm text-slate-500">{label}</p>
    <div className="text-sm font-medium text-slate-800">{children}</div>
  </div>
);

const ActionButton: FC<{
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'destructive';
  children: React.ReactNode;
}> = ({ onClick, disabled, variant = 'primary', children }) => {
  const baseClasses =
    'px-4 py-2 text-sm font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variantClasses = {
    primary: 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    secondary:
      'text-blue-700 bg-blue-100 hover:bg-blue-200 focus:ring-blue-500',
    destructive: 'text-red-700 bg-red-100 hover:bg-red-200 focus:ring-red-500',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]}`}
    >
      {children}
    </button>
  );
};

// --- Main User Page Component ---

export const UserPage: FC<{
  session: Session;
  handleLogout: () => void;
  loading: boolean;
}> = ({ session, handleLogout, loading }) => {
  const [displayName, setDisplayName] = useState(
    session.user.user_metadata.display_name || ''
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoadingGroupInfo, setIsLoadingGroupInfo] = useState(true);
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [view, setView] = useState<'idle' | 'create' | 'join'>('idle');
  const [newGroupName, setNewGroupName] = useState('');
  const [joinGroupName, setJoinGroupName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      console.error('Error fetching group data:', error);
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
      toast.success('Display name updated!');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating display name:', error);
      toast.error('Failed to update display name.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error('Group name cannot be empty.');
      return;
    }
    setIsSubmitting(true);
    try {
      console.log(newGroupName, session.user.id);
      const newGroup = await createGroup(newGroupName, session.user.id);
      await joinGroupByName(session.user.id, newGroup.name);
      await fetchGroupData();
      setView('idle');
      setNewGroupName('');
      toast.success(`Successfully created and joined "${newGroup.name}"!`);
    } catch (error) {
      console.error('Failed to create group:', error);
      toast.error('Failed to create group.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!joinGroupName.trim()) {
      toast.error('Group ID cannot be empty.');
      return;
    }
    setIsSubmitting(true);
    try {
      await joinGroupByName(session.user.id, joinGroupName);
      await fetchGroupData();
      setView('idle');
      setJoinGroupName('');
      toast.success(`Successfully joined group!`);
    } catch (error) {
      console.error('Failed to join group:', error);
      toast.error('Failed to join group. Please check the ID and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (confirm('Are you sure you want to leave this group?')) {
      setIsSubmitting(true);
      try {
        await leaveOrBeKickedFromGroup(session.user.id);
        await fetchGroupData();
      } catch (error) {
        console.error('Failed to leave group:', error);
        toast.error('Failed to leave the group.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleDeleteGroup = async () => {
    if (
      confirm(
        'Are you sure you want to DELETE this group for everyone? This action cannot be undone.'
      )
    ) {
      if (!group) return;
      setIsSubmitting(true);
      try {
        await deleteGroup(group.id);
        await fetchGroupData();
      } catch (error) {
        console.error('Failed to delete group:', error);
        toast.error('Failed to delete the group.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const renderGroupSection = () => {
    if (isLoadingGroupInfo) {
      return (
        <div className="space-y-2 pt-4 mt-4 border-t border-slate-200">
          <div className="h-4 bg-slate-200 rounded w-1/3"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        </div>
      );
    }

    if (group) {
      const isAdmin = session.user.id === group.admin_id;
      return (
        <div className="pt-4 border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">My Group</h3>
          <p className="text-sm text-slate-500 mt-1 mb-4">
            Manage your group settings
          </p>
          <InfoRow label="Group Name">{group.name}</InfoRow>
          <InfoRow label="My Role">{isAdmin ? 'Admin 👑' : 'Member'}</InfoRow>
          <div>
            <p className="text-sm text-slate-500 my-2">
              Members ({members.length})
            </p>
            <ul className="space-y-1 text-sm text-slate-700">
              {members.map((member) => (
                <li key={member.id} className="pl-4">
                  {member.display_name || 'New Member'}
                </li>
              ))}
            </ul>
          </div>
          <div className="pt-8">
            <ActionButton
              onClick={isAdmin ? handleDeleteGroup : handleLeaveGroup}
              disabled={isSubmitting}
              variant="destructive"
            >
              {isSubmitting ? '...' : isAdmin ? 'Delete Group' : 'Leave Group'}
            </ActionButton>
          </div>
        </div>
      );
    }

    if (view === 'create' || view === 'join') {
      return (
        <div className="pt-4 mt-4 border-t border-slate-200 space-y-4">
          <h3 className="font-semibold text-slate-900">
            {view === 'create'
              ? 'Create a New Group'
              : 'Join an Existing Group'}
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={view === 'create' ? newGroupName : joinGroupName}
              onChange={(e) =>
                view === 'create'
                  ? setNewGroupName(e.target.value)
                  : setJoinGroupName(e.target.value)
              }
              placeholder={
                view === 'create' ? 'Enter group name' : 'Paste group name'
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <ActionButton
              onClick={view === 'create' ? handleCreateGroup : handleJoinGroup}
              disabled={isSubmitting}
              variant={view === 'create' ? 'primary' : 'secondary'}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : view === 'create' ? (
                'Create'
              ) : (
                'Join'
              )}
            </ActionButton>
          </div>
          <button
            onClick={() => setView('idle')}
            className="text-xs text-slate-500 hover:underline"
          >
            Cancel
          </button>
        </div>
      );
    }

    return (
      <div className="text-center pt-6 mt-6 border-t border-dashed">
        <Users className="mx-auto h-12 w-12 text-slate-300" />
        <h3 className="mt-2 text-sm font-semibold text-slate-800">
          No Group Found
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          You are not part of a group yet.
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <ActionButton onClick={() => setView('create')} variant="primary">
            <Plus className="-ml-1 mr-2 h-4 w-full" /> Create Group
          </ActionButton>
          <ActionButton onClick={() => setView('join')} variant="secondary">
            <LogIn className="-ml-1 mr-2 h-4 w-full" /> Join Group
          </ActionButton>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-md border border-slate-200">
        <div className="p-6">
          <h2 className="text-xl font-bold text-slate-900">My Account</h2>
          <p className="text-sm text-slate-500 mt-1">Manage your profile</p>
        </div>
        <div className="px-6 pb-6 space-y-2">
          <InfoRow label="Email">
            <span>{session.user.email}</span>
          </InfoRow>
          <InfoRow label="Display Name">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-2 py-1 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={handleUpdateName}
                  disabled={isUpdating}
                  className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-50"
                >
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  disabled={isUpdating}
                  className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>{displayName || 'Not set'}</span>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 text-slate-500 hover:text-slate-900"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </div>
            )}
          </InfoRow>
          {renderGroupSection()}
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 rounded-b-xl flex justify-end">
          <button
            onClick={handleLogout}
            disabled={loading}
            className="text-sm font-medium mx-auto text-slate-600 hover:text-slate-900 disabled:opacity-50"
          >
            {loading ? 'Logging out...' : 'Log Out'}
          </button>
        </div>
      </div>
    </div>
  );
};
