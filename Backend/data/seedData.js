export const initialUsers = [
  {
    userId: "user01",
    username: "JohnDoe",
    email: "john@example.com",
    password: "hashedPassword123",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
    channels: ["channel01"]
  }
];

export const initialChannels = [
  {
    channelId: "channel01",
    channelName: "Code with John",
    owner: "user01",
    description: "Coding tutorials and tech reviews by John Doe.",
    channelBanner: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80",
    subscribers: 5200,
    videos: ["video01", "video02"],
    createdAt: "2024-01-15T00:00:00.000Z"
  },
  {
    channelId: "channel02",
    channelName: "DevMastery",
    owner: "user02",
    description: "Learn how to build complete full-stack web applications and UI clones.",
    channelBanner: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80",
    avatarUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=160&q=80",
    subscribers: 1420000,
    videos: ["video02"],
    createdAt: "2023-11-20T00:00:00.000Z"
  },
  {
    channelId: "channel03",
    channelName: "JS Wizards",
    owner: "user03",
    description: "Modern JavaScript deep dives, clean architecture, and frontend performance.",
    channelBanner: "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?auto=format&fit=crop&w=1600&q=80",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80",
    subscribers: 620000,
    videos: ["video03"],
    createdAt: "2023-08-10T00:00:00.000Z"
  }
];

export const initialVideos = [
  {
    videoId: "video01",
    title: "Learn React in 30 Minutes - A Beginner's Complete Crash Course",
    thumbnailUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=1280&q=80",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    description: "A fast-paced, hands-on tutorial to get started with React. We cover components, props, state, hooks (useState, useEffect), and JSX syntax. Perfect for beginners and developers coming from vanilla JavaScript.\n\nTimestamps:\n0:00 - Introduction & Prerequisites\n3:15 - Setting up your first React App with Vite\n8:40 - JSX and Component Architecture\n15:20 - Props and State management\n22:10 - useEffect hook and API calls\n28:30 - Final Project Wrap-up",
    channelId: "channel01",
    channelName: "Code with John",
    uploader: "Code with John",
    subscribers: "5.2K",
    views: 152430,
    likes: 12450,
    dislikes: 145,
    uploadDate: "2024-09-20",
    duration: "30:15",
    category: "React",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
    comments: [
      {
        commentId: "comment01_1",
        userId: "user02",
        author: "Sarah Connor",
        avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
        text: "Great video! Very helpful explanation of useState and component re-renders.",
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
    description: "Learn how to build a complete YouTube UI clone from scratch using React, modern CSS Grid, Flexbox, responsive design principles, and custom video player integration.",
    channelId: "channel01",
    channelName: "Code with John",
    uploader: "Code with John",
    subscribers: "5.2K",
    views: 89400,
    likes: 4210,
    dislikes: 110,
    uploadDate: "2024-08-15",
    duration: "1:15:20",
    category: "React",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
    comments: [
      {
        commentId: "comment02_1",
        userId: "user04",
        author: "Michael Scott",
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
        text: "This clone tutorial is pure gold! The comment section functionality is spot on.",
        timestamp: "2024-08-16T10:12:00Z",
        likes: 72
      }
    ]
  },
  {
    videoId: "video03",
    title: "JavaScript Pro Tips: 10 Hidden Features You Need to Know",
    thumbnailUrl: "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?auto=format&fit=crop&w=1280&q=80",
    videoUrl: "https://media.w3.org/2010/05/sintel/trailer_hd.mp4",
    description: "Level up your modern JavaScript knowledge with clean code practices, optional chaining, structuredClone, async generators, and performance tricks.",
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
    comments: []
  }
];
