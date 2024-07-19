import {
  Client,
  Account,
  ID,
  Avatars,
  Databases,
  Query,
  Storage,
} from "react-native-appwrite";
export const config = {
  endpoint: "https://cloud.appwrite.io/v1",
  platform: "com.arqm.aora",
  projectId: "6697d6b50026556af2cd",
  databaseId: "6697d97f002d11d66e00",
  userCollectionId: "6697d9b40016bf7743b2",
  videoCollectionId: "6697da080012a1978b40",
  storageId: "6697dc6e00049df8dc7f",
};
// Init your React Native SDK
const client = new Client();

client
  .setEndpoint(config.endpoint) // Your Appwrite Endpoint
  .setProject(config.projectId) // Your project ID
  .setPlatform(config.platform); // Your application ID or bundle ID.
const account = new Account(client);
const avatars = new Avatars(client);
const databases = new Databases(client);
const storage = new Storage(client);

export const createUser = async (email, password, username) => {
  try {
    const newAccount = await account.create(
      ID.unique(),
      email,
      password,
      username
    );
    if (!newAccount) throw Error;
    const avatarURL = avatars.getInitials(username);
    await signIn(email, password);
    const newUser = await databases.createDocument(
      config.databaseId,
      config.userCollectionId,
      ID.unique(),
      {
        accountId: newAccount.$id,
        email: email,
        username: username,
        avatar: avatarURL,
      }
    );
    return newUser;
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};
// export const createUser = async (email, password, username) => {
//   try {
//     // Check if there's an existing session and delete it
//     // try {
//     //   const currentSession = await account.getSession("current");
//     //   if (currentSession) {
//     //     await account.deleteSession("current");
//     //   }
//     // } catch (error) {
//     //   // Handle error if there is no current session
//     //   console.log("No existing session to delete");
//     // }

//     // Create new user and session
//     const newAccount = await account.create(
//       ID.unique(),
//       email,
//       password,
//       username
//     );
//     if (!newAccount) throw new Error("Failed to create new account");

//     const avatarURL = avatars.getInitials(username);
//     const session = await account.createEmailPasswordSession(email, password);

//     const newUser = await databases.createDocument(
//       config.databaseId,
//       config.userCollectionId,
//       ID.unique(),
//       {
//         accountId: newAccount.$id,
//         email,
//         username,
//         avatar: avatarURL,
//       }
//     );
//     return newUser;
//   } catch (error) {
//     console.log(error);
//     throw new Error(error.message);
//   }
// };
export const signIn = async (email, password) => {
  try {
    // try {
    //   const currentSession = await account.getSession("current");
    //   if (currentSession) {
    //     await account.deleteSession("current");
    //   }
    // } catch (error) {
    //   // Handle error if there is no current session
    //   console.log("No existing session to delete");
    // }
    const session = await account.createEmailPasswordSession(email, password);
    return session;
  } catch (error) {
    throw new Error(error);
  }
};
export const getCurrentUser = async () => {
  try {
    const currentAccount = await account.get();
    if (!currentAccount) throw Error;

    const currentUser = await databases.listDocuments(
      config.databaseId,
      config.userCollectionId,
      [Query.equal("accountId", currentAccount.$id)]
    );
    if (!currentUser) throw Error;
    return currentUser.documents[0];
  } catch (error) {
    console.log(error);
  }
};
export const getAllPosts = async () => {
  try {
    const posts = await databases.listDocuments(
      config.databaseId,
      config.videoCollectionId,
      [Query.orderDesc("$createdAt")]
    );
    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
};
export const getLatestPosts = async () => {
  try {
    const posts = await databases.listDocuments(
      config.databaseId,
      config.videoCollectionId,
      [Query.orderDesc("$createdAt", Query.limit(7))]
    );
    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
};
export const searchPosts = async (query) => {
  try {
    const posts = await databases.listDocuments(
      config.databaseId,
      config.videoCollectionId,
      [Query.search("title", query)]
    );
    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
};
export const getUserPosts = async (userId) => {
  try {
    const posts = await databases.listDocuments(
      config.databaseId,
      config.videoCollectionId,
      [Query.equal("creator", userId), Query.orderDesc("$createdAt")]
    );
    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
};
export const signOut = async () => {
  try {
    const session = await account.deleteSession("current");
  } catch (error) {
    throw new Error(error);
  }
};
export const getFilePreview = async (fileId, type) => {
  let fileUrl;
  try {
    if (type === "video") {
      fileUrl = storage.getFileView(config.storageId, fileId);
    } else if (type === "image") {
      fileUrl = storage.getFilePreview(
        config.storageId,
        fileId,
        2000,
        2000,
        "top",
        100
      );
    } else {
      throw new Error("Invalid file type");
    }
    if (!fileUrl) throw Error;
    return fileUrl;
  } catch (error) {
    throw new Error(error);
  }
};
export const uploadFile = async (file, type) => {
  if (!file) return;
  const { mimeType, ...rest } = file;
  const asset = {
    name: file.fileName,
    type: file.mimeType,
    size: file.fileSize,
    uri: file.uri,
  };
  try {
    const uploadedFile = await storage.createFile(
      config.storageId,
      ID.unique(),
      asset
    );

    const fileUrl = await getFilePreview(uploadedFile.$id, type);

    return fileUrl;
  } catch (error) {
    throw new Error(error);
  }
};
export const createVideo = async (form) => {
  try {
    const [thumbnailUrl, videoUrl] = await Promise.all([
      uploadFile(form.thumbnail, "image"),
      uploadFile(form.video, "video"),
    ]);
    const newPost = await databases.createDocument(
      config.databaseId,
      config.videoCollectionId,
      ID.unique(),
      {
        title: form.title,
        thumbnail: thumbnailUrl,
        video: videoUrl,
        prompt: form.prompt,
        creator: form.userId,
      }
    );
    return newPost;
  } catch (error) {
    throw new Error(error);
  }
};
