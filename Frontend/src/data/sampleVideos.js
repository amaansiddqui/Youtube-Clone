export const initialVideos = [
  {
    videoId: "video01",
    title: "Learn React in 30 Minutes",
    thumbnailUrl: "https://example.com/thumbnails/react30min.png",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    description: "A quick tutorial to get started with React.",
    channelId: "channel01",
    channelName: "CodeCraft Academy",
    uploader: "user01",
    subscribers: "845K",
    views: 15200,
    likes: 1023,
    dislikes: 45,
    uploadDate: "2024-09-20",
    duration: "30:15",
    category: "React",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
    comments: [
      {
        commentId: "comment01",
        userId: "user02",
        author: "Sarah Connor",
        avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
        text: "Great video! Very helpful.",
        timestamp: "2024-09-21T08:30:00Z",
        likes: 38
      }
    ]
  },
  {
    videoId: "video02",
    title: "Build and Deploy a Full Stack YouTube Clone with React & Tailwind",
    thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1280&q=80",
    videoUrl: "https://vjs.zencdn.net/v/oceans.mp4",
    description: "Learn how to build a complete YouTube UI clone from scratch using React, modern CSS Grid, Flexbox, responsive design principles, and custom video player integration.\n\nFeatures included:\n- Responsive YouTube Navigation & Mini Sidebar\n- Video Player with Like / Dislike interactions\n- Real-time Comment section (Add, Edit, Delete)\n- Category filtering & Search system\n- Persistent storage with mock database layer",
    channelId: "channel02",
    channelName: "DevMastery",
    uploader: "DevMastery",
    subscribers: "1.42M",
    views: 89400,
    likes: 4210,
    dislikes: 110,
    uploadDate: "2024-08-15",
    duration: "1:15:20",
    category: "React",
    avatarUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80",
    comments: [
      {
        commentId: "comment02_1",
        userId: "user04",
        author: "Michael Scott",
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
        text: "This clone tutorial is pure gold! The comment section functionality is spot on.",
        timestamp: "2024-08-16T10:12:00Z",
        likes: 72
      },
      {
        commentId: "comment02_2",
        userId: "user05",
        author: "Emily Watson",
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
        text: "Tailwind CSS makes building YouTube's dark theme so clean. Fantastic walkthrough!",
        timestamp: "2024-08-17T19:40:00Z",
        likes: 29
      }
    ]
  },
  {
    videoId: "video03",
    title: "JavaScript Pro Tips: 10 Hidden Features You Need to Know",
    thumbnailUrl: "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?auto=format&fit=crop&w=1280&q=80",
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    description: "Level up your modern JavaScript knowledge with clean code practices, optional chaining, structuredClone, async generators, and performance tricks every senior engineer uses daily.\n\nCode repo available on GitHub. Don't forget to like and subscribe for more modern web development tips!",
    channelId: "channel03",
    channelName: "JS Wizards",
    uploader: "JS Wizards",
    subscribers: "620K",
    views: 342100,
    likes: 18450,
    dislikes: 320,
    uploadDate: "2024-07-02",
    duration: "18:04",
    category: "JavaScript",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
    comments: [
      {
        commentId: "comment03_1",
        userId: "user06",
        author: "David Kim",
        avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
        text: "I did not know about structuredClone until today! That saves so much boilerplate.",
        timestamp: "2024-07-03T02:15:00Z",
        likes: 91
      }
    ]
  }
];

// Empty moreVideos array as requested to remove extra videos
export const moreVideos = [];

export const sampleVideos = initialVideos;
export const allVideos = [...sampleVideos];

