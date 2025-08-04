import { apiRequest } from '../utils/api';
import {
  SendFriendRequestRequest,
  SendFriendRequestResponse,
  SearchUsersRequest,
  SearchUsersResponse,
  GetFriendsResponse,
  GetPendingRequestsResponse,
  AcceptFriendRequestResponse,
} from '@sports-buddy/shared-types';

class FriendsService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    return apiRequest<T>(`/api/friends${endpoint}`, options);
  }

  // Send friend request
  async sendFriendRequest(
    data: SendFriendRequestRequest,
    token: string
  ): Promise<SendFriendRequestResponse> {
    return this.request<SendFriendRequestResponse>('/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  }

  // Accept friend request
  async acceptFriendRequest(
    connectionId: string,
    token: string
  ): Promise<AcceptFriendRequestResponse> {
    return this.request<AcceptFriendRequestResponse>(`/request/${connectionId}/accept`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Reject friend request
  async rejectFriendRequest(
    connectionId: string,
    token: string
  ): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/request/${connectionId}/reject`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Remove friend
  async removeFriend(
    friendId: string,
    token: string
  ): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/${friendId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Get friends list
  async getFriends(token: string): Promise<GetFriendsResponse> {
    return this.request<GetFriendsResponse>('/', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Get pending friend requests
  async getPendingRequests(token: string): Promise<GetPendingRequestsResponse> {
    return this.request<GetPendingRequestsResponse>('/requests', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Search users
  async searchUsers(
    query: string,
    token: string
  ): Promise<SearchUsersResponse> {
    const params = new URLSearchParams({ query });
    return this.request<SearchUsersResponse>(`/search?${params}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Get friend suggestions
  async getFriendSuggestions(
    radius: number = 10,
    token: string
  ): Promise<{ suggestions: any[] }> {
    const params = new URLSearchParams({ radius: radius.toString() });
    return this.request<{ suggestions: any[] }>(`/suggestions?${params}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}

export const friendsService = new FriendsService();