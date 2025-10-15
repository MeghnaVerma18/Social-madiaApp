import Chats from './models/Chats.js';
import Post from './models/Post.js';
import Stories from './models/Stories.js';
import User from './models/Users.js';

const userSocketMap = new Map(); // userId -> socket.id

const SocketHandler = (socket) => {
  // Register user with socket.id
  socket.on('register-user', ({ userId }) => {
    userSocketMap.set(userId, socket.id);
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });

  // Create a new post
  socket.on('create-post', async ({ userId, userName, userPic, fileType, file, description, location }) => {
    try {
      const newPost = new Post({
        userId,
        userName,
        userPic,
        fileType,
        file,
        description,
        location,
        likes: [],
        comments: []
      });
      const savedPost = await newPost.save();
      socket.emit('new-post-created', { post: savedPost });
      socket.broadcast.emit('new-post-created', { post: savedPost });
    } catch (error) {
      console.error('Error creating post:', error);
    }
  });

  socket.on('postLiked', async ({ userId, postId }) => {
    await Post.updateOne({ _id: postId }, { $addToSet: { likes: userId } });
    socket.emit("likeUpdated");
  });

  socket.on('postUnLiked', async ({ userId, postId }) => {
    await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
    socket.emit("likeUpdated");
  });

  socket.on('makeComment', async ({ postId, username, comment }) => {
    await Post.updateOne({ _id: postId }, { $push: { comments: [username, comment] } });
  });

  socket.on("fetch-profile", async ({ _id }) => {
    const user = await User.findOne({ _id });
    socket.emit("profile-fetched", { profile: user });
  });

  socket.on("updateProfile", async ({ userId, profilePic, username, about }) => {
    await User.updateOne({ _id: userId }, { profilePic, username, about });
    const updatedUser = await User.findOne({ _id: userId });
    socket.emit("profile-fetched", { profile: updatedUser });
  });

  socket.on("user-search", async ({ username }) => {
    const user = await User.findOne({ username });
    socket.emit("searched-user", { user });
  });

  socket.on('followUser', async ({ ownId, followingUserId }) => {
    await User.updateOne({ _id: ownId }, { $addToSet: { following: followingUserId } });
    await User.updateOne({ _id: followingUserId }, { $addToSet: { followers: ownId } });

    const user1 = await User.findOne({ _id: ownId });
    const user2 = await User.findOne({ _id: followingUserId });
    socket.emit('userFollowed', { following: user1.following });

    if (user1.following.includes(user2._id.toString()) && user2.following.includes(user1._id.toString())) {
      const chatId = user1._id > user2._id ? user1._id + user2._id : user2._id + user1._id;
      const existingChat = await Chats.findById(chatId);
      if (!existingChat) {
        const newChat = new Chats({ _id: chatId });
        await newChat.save();
      }
    }
  });

  socket.on('unFollowUser', async ({ ownId, followingUserId }) => {
    await User.updateOne({ _id: ownId }, { $pull: { following: followingUserId } });
    await User.updateOne({ _id: followingUserId }, { $pull: { followers: ownId } });
    const user = await User.findOne({ _id: ownId });
    socket.emit('userUnFollowed', { following: user.following });
  });

  socket.on('fetch-friends', async ({ userId }) => {
    const userData = await User.findOne({ _id: userId });
    const friendsList = userData.following.filter(id => userData.followers.includes(id));
    const friendsData = await User.find({ _id: { $in: friendsList } }, { _id: 1, username: 1, profilePic: 1 });
    socket.emit("friends-data-fetched", { friendsData });
  });

  socket.on('fetch-messages', async ({ chatId }) => {
    const chat = await Chats.findOne({ _id: chatId });
    await socket.join(chatId);
    socket.emit('messages-updated', { chat });
  });

  socket.on('update-messages', async ({ chatId }) => {
    try {
      const chat = await Chats.findOne({ _id: chatId });
      socket.emit('messages-updated', { chat });
    } catch (error) {
      console.error('Error updating messages:', error);
    }
  });

  socket.on('new-message', async ({ chatId, id, text, file, senderId, date }) => {
    try {
      await Chats.findOneAndUpdate(
        { _id: chatId },
        { $addToSet: { messages: { id, text, file, senderId, date } } },
        { new: true }
      );
      const chat = await Chats.findOne({ _id: chatId });
      socket.emit('messages-updated', { chat });

      // Deliver to receiver
      const receiverId = chatId.replace(senderId, '');
      const receiverSocketId = userSocketMap.get(receiverId);
      if (receiverSocketId) {
        socket.to(receiverSocketId).emit('message-from-user', { chat });
      }
    } catch (error) {
      console.error('Error adding new message:', error);
    }
  });

  socket.on('chat-user-searched', async ({ ownId, username }) => {
    const user = await User.findOne({ username });
    if (user && user.followers.includes(ownId) && user.following.includes(ownId)) {
      socket.emit('searched-chat-user', { user });
    } else {
      socket.emit('no-searched-chat-user');
    }
  });

  socket.on('fetch-all-posts', async () => {
    const posts = await Post.find();
    socket.emit('all-posts-fetched', { posts });
  });

  socket.on('delete-post', async ({ postId }) => {
    await Post.deleteOne({ _id: postId });
    const posts = await Post.find();
    socket.emit('post-deleted', { posts });
  });

  socket.on('create-new-story', async ({ userId, username, userPic, fileType, file, text }) => {
    const newStory = new Stories({ userId, username, userPic, fileType, file, text });
    await newStory.save();
  });

  socket.on('fetch-stories', async () => {
    const stories = await Stories.find();
    socket.emit('stories-fetched', { stories });
  });

  socket.on('story-played', async ({ storyId, userId }) => {
    await Stories.updateOne({ _id: storyId }, { $addToSet: { viewers: userId } });
  });
};

export default SocketHandler;
