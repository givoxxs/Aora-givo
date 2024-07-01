import { Account, Avatars, Client, Databases, ID, Query, Storage } from 'react-native-appwrite';

export default config = {
    endpoint: 'https://cloud.appwrite.io/v1',
    platform: 'com.jsm.aora-givoxxs',
    projectId: '667aed5d003cc27c61aa',
    databaseId: '667bba370032bb0902ae',
    userCollectionId: '667bba5b0030921182cd',
    videoCollectionId: '667bbac000379c5db76a',
    storageId: '667bbccd0003a5a69a6e',
}

// Init your React Native SDK
const client = new Client();

client
    .setEndpoint(config.endpoint) // Your Appwrite Endpoint
    .setProject(config.projectId) // Your project ID
    .setPlatform(config.platform) // Your applicatio    n ID or bundle ID.
;

const account = new Account(client);
const avatars = new Avatars(client);
const databases = new Databases(client);
const storages = new Storage(client);

export async function createUser(username, email, password) {
    try {
      const newAccount = await account.create(
        ID.unique(),
        email,
        password,
        username
      );
  
      if (!newAccount) throw Error;
  
      const avatarUrl = avatars.getInitials(username);
  
      await signIn(email, password);
  
      const newUser = await databases.createDocument(
        config.databaseId,
        config.userCollectionId,
        ID.unique(),
        {
          accountId: newAccount.$id,
          email: email,
          username: username,
          avatar: avatarUrl,
        }
      );
  
      return newUser;
    } catch (error) {
      throw new Error(error);
    }
  }

// Sign In
export async function signIn(email, password) {
    try {
      // const sessions = await account.getSession();
      // if (sessions.total > 0) {
      //   // Optionally, delete existing sessions
      //   await Promise.all(sessions.sessions.map(session => account.deleteSession(session.$id)));
      // }
      const session = await account.createEmailPasswordSession(email, password);
  
      return session;
    } catch (error) {
      throw new Error(error);
    }
  }

// Get Account
export async function getAccount() {
    try {
      const currentAccount = await account.get();
  
      return currentAccount;
    } catch (error) {
      throw new Error(error);
    }
  }
  
  // Get Current User
  export async function getCurrentUser() {
    try {
      const currentAccount = await getAccount();
      if (!currentAccount) throw Error;
  
      const currentUser = await databases.listDocuments(
        config.databaseId,
        config.userCollectionId,
        [Query.equal("accountId", currentAccount.$id)]
      );
  
      if (!currentUser) throw Error;
  
      // console.log(currentUser.documents[0]);
      return currentUser.documents[0];
    } catch (error) {
      console.log(error);
      return null;
    }
  }
  
export const getAllPosts = async () => {
  try {
    const posts = await databases.listDocuments(
      config.databaseId,
      config.videoCollectionId,
      [Query.orderDesc("$createdAt")]
    )

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

export const getLatestPosts = async () => {
  try {
    const posts = await databases.listDocuments(
      config.databaseId,
      config.videoCollectionId,
      [Query.orderDesc("$createdAt"), Query.limit(7)]
    )

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}
export const searchPosts = async (query) => {
  try {
    const posts = await databases.listDocuments(
      config.databaseId,
      config.videoCollectionId,
      [Query.search("title", query)]
    )

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

export const getUserPosts = async (userId) => {
  try {
    const posts = await databases.listDocuments(
      config.databaseId,
      config.videoCollectionId,
      [Query.equal("users", userId), Query.orderDesc("$createdAt")]
    )

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

export const signOut = async () => {
  try {
    const session = await account.deleteSession('current');

    return session;
  } catch (error) {
    throw new Error(error);
  }
}

export const getFilePreview = async(fileId, type) => {
  let fileUrl;

  try {
    if (type === 'video') {
      fileUrl = storages.getFileView(config.storageId, fileId)
    } else if (type === 'image') {
      fileUrl = storages.getFilePreview(config.storageId, fileId, 2000, 2000, 'top', 100)
    } else {
      throw new Error('Invalid file type');
    }

    if (!fileUrl) throw new Error;

    return fileUrl;
  } catch (error) {
    throw new Error(error)
  }
}

export const uploadFile = async (file, type) => {
  if (!file) return;

  const asset = {
    name: file.fileName,
    type: file.mimeType,
    size: file.fileSize,
    uri: file.uri,
  }

  try {
    const uploadFile = await storages.createFile(
      config.storageId,
      ID.unique(),
      asset
    );

    const fileUrl = await getFilePreview(uploadFile.$id, type);

    return fileUrl;
  } catch (error) {
    throw new Error(error);
  }

}

export const createVideo = async (form) => {
  try {
    const [thumbnailUrl, videoUrl] = await Promise.all([
      uploadFile(form.thumbnail, 'image'),
      uploadFile(form.video, 'video')
    ])

    const newPost = await databases.createDocument(
      config.databaseId,
      config.videoCollectionId,
      ID.unique(),
      {
        title: form.title,
        thumbnail: thumbnailUrl,
        video: videoUrl,
        prompt: form.prompt,
        users: form.userId
      }
    )
    
    return newPost;
  } catch (error) {
    throw new Error(error);
  }
}