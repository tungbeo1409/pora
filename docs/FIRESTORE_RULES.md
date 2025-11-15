# Firestore Security Rules

Rules bảo mật cho Firestore Database. Copy toàn bộ nội dung này vào Firebase Console → Firestore Database → Rules.

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }
    
    // Users collection
    match /users/{userId} {
      // Anyone can read user profiles
      allow read: if true;
      
      // Only the user can write their own data
      allow create: if isOwner(userId);
      allow update: if isOwner(userId);
      allow delete: if isOwner(userId);
    }
    
    // Posts collection
    match /posts/{postId} {
      // Anyone can read posts
      allow read: if true;
      
      // Only authenticated users can create posts
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
      
      // Only post owner can update/delete
      allow update: if isSignedIn() && resource.data.userId == request.auth.uid;
      allow delete: if isSignedIn() && resource.data.userId == request.auth.uid;
    }
    
    // Comments collection (subcollection of posts)
    match /posts/{postId}/comments/{commentId} {
      // Anyone can read comments
      allow read: if true;
      
      // Only authenticated users can create comments
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
      
      // Only comment owner can update/delete
      allow update: if isSignedIn() && resource.data.userId == request.auth.uid;
      allow delete: if isSignedIn() && resource.data.userId == request.auth.uid;
    }
    
    // Reactions collection (subcollection of posts or comments)
    match /{document=**}/reactions/{reactionId} {
      // Anyone can read reactions
      allow read: if true;
      
      // Only authenticated users can add reactions
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
      
      // Only reaction owner can delete
      allow delete: if isSignedIn() && resource.data.userId == request.auth.uid;
    }
    
    // Follows collection
    // Document ID format: {followerId}_{followingId}
    match /follows/{followId} {
      // Anyone authenticated can read follows
      allow read: if isSignedIn();
      
      // User can create follow if they are the follower
      allow create: if isSignedIn() && 
                       request.resource.data.followerId == request.auth.uid;
      
      // User can delete if they are the follower
      allow delete: if isSignedIn() && 
                       resource.data.followerId == request.auth.uid;
      
      // No updates allowed (follows are immutable)
      allow update: if false;
    }
    
    // Friends collection
    // Document ID format: {userId1}_{userId2} (sorted)
    match /friends/{friendId} {
      // User can read if they are part of the friendship
      allow read: if isSignedIn() && 
                     (resource.data.userId == request.auth.uid || 
                      resource.data.friendId == request.auth.uid);
      
      // User can create if they are the requester
      allow create: if isSignedIn() && 
                       request.resource.data.requestedBy == request.auth.uid &&
                       (request.resource.data.userId == request.auth.uid ||
                        request.resource.data.friendId == request.auth.uid);
      
      // User can update if they are part of the friendship (for accept/reject)
      allow update: if isSignedIn() && 
                       (resource.data.userId == request.auth.uid || 
                        resource.data.friendId == request.auth.uid);
      
      // User can delete if they are part of the friendship (unfriend)
      allow delete: if isSignedIn() && 
                       (resource.data.userId == request.auth.uid || 
                        resource.data.friendId == request.auth.uid);
    }
    
    // Notifications collection
    match /notifications/{notificationId} {
      // Users can only read their own notifications
      allow read: if isSignedIn() && resource.data.userId == request.auth.uid;
      
      // System can create notifications (any authenticated user can create for another user)
      allow create: if isSignedIn();
      
      // Users can update their own notifications (mark as read)
      allow update: if isSignedIn() && resource.data.userId == request.auth.uid;
      
      // Users can delete their own notifications
      allow delete: if isSignedIn() && resource.data.userId == request.auth.uid;
    }
    
    // Images collection (for Base64 stored images)
    match /images/{imageId} {
      // Anyone authenticated can read images
      allow read: if isSignedIn();
      
      // User can create images if they are the uploader
      allow create: if isSignedIn() && 
                       request.resource.data.uploadedBy == request.auth.uid;
      
      // User can update/delete their own images
      allow update: if isSignedIn() && resource.data.uploadedBy == request.auth.uid;
      allow delete: if isSignedIn() && resource.data.uploadedBy == request.auth.uid;
    }
    
    // Videos collection (URLs only, actual videos in Cloudinary)
    match /videos/{videoId} {
      // Anyone authenticated can read video metadata
      allow read: if isSignedIn();
      
      // User can create videos if they are the uploader
      allow create: if isSignedIn() && 
                       request.resource.data.uploadedBy == request.auth.uid;
      
      // User can update/delete their own videos
      allow update: if isSignedIn() && resource.data.uploadedBy == request.auth.uid;
      allow delete: if isSignedIn() && resource.data.uploadedBy == request.auth.uid;
    }
    
    // Audio collection (URLs only, actual audio in Cloudinary)
    match /audio/{audioId} {
      // Anyone authenticated can read audio metadata
      allow read: if isSignedIn();
      
      // User can create audio if they are the uploader
      allow create: if isSignedIn() && 
                       request.resource.data.uploadedBy == request.auth.uid;
      
      // User can update/delete their own audio
      allow update: if isSignedIn() && resource.data.uploadedBy == request.auth.uid;
      allow delete: if isSignedIn() && resource.data.uploadedBy == request.auth.uid;
    }
    
    // Deny all other collections by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Notes

1. **Chat Messages**: Không có rules cho `messages` vì chúng ta dùng Realtime Database cho chat (để tối ưu cost).

2. **Conversations**: Không có rules cho `conversations` vì metadata được lưu trong Realtime Database.

3. **Follows**: Document ID format là `{followerId}_{followingId}`, rules cho phép follower tạo và xóa.

4. **Friends**: Document ID format là `{userId1}_{userId2}` (sorted), cả hai user đều có thể read/update/delete.

5. **Notifications**: Bất kỳ authenticated user nào cũng có thể tạo notification (cho system), nhưng chỉ có thể đọc/update/delete notification của chính mình.

6. **Default Deny**: Tất cả collections khác đều bị deny mặc định.

