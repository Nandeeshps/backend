import express from "express"
import mongoose from "mongoose"
import dontenv from "dotenv"
import cors from 'cors'
import bodyParser from "body-parser"
import userRoutes from './routes/user.js'
import videoRoutes from './routes/video.js'
import commentsRoutes from './routes/comments.js'
import GroupChat from './models/GroupChat.js';
import User from './models/auth.js';
import privateC from './models/privateC.js';
import path from 'path';


dontenv.config()


const app=express();


app.use(cors())
app.use(express.json({limit:"30mb",extended:true}))
app.use(express.urlencoded({limit:"30mb",extended:true}))
app.use('/uploads',express.static(path.join('uploads')))



app.get('/',(req,res)=>{
    res.send("hello")
})
app.use(bodyParser.json())

app.use('/user',userRoutes)
app.use('/video',videoRoutes)
app.use('/comment',commentsRoutes)




app.post('/api/createChat', async (req, res) => {
  const chatDetails = req.body;

  chatDetails.groupMembers = chatDetails.groupMembers.split(',').map(member => member.trim());

  chatDetails.admin = chatDetails.admin.split(',').map(member => member.trim());
  
  try {
    const newChat = await GroupChat.create(chatDetails); // Use the GroupChat model
    await newChat.save();
    res.status(201).json(newChat);
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/api/chats', async (req, res) => {
  try {
    const chats = await GroupChat.find(); // Use the GroupChat model
    res.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/api/groupNames', async (req, res) => {
  try{
    const groupNames = await GroupChat.find({}, 'groupName');
    res.json({ groupNames });
  }catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/api/checkUsers', async (req, res) => {
  const { groupMembers } = req.body;

  try {
    const existingUsers = await User.find({ email: { $in: groupMembers } });

    const existingEmails = existingUsers.map((User) => User.email);

    if (existingEmails.length === groupMembers.length) {
      // All users exist
      res.json({ allUsersExist: true });
    } else {
      // Some users do not exist
      const nonExistingUsers = groupMembers.filter((email) => !existingEmails.includes(email)).join(', ');
      res.status(400).json({ allUsersExist: false, nonExistingUsers });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/addMember', async (req, res) => {
  const { groupName, memberName } = req.body;

  try {
    const group = await GroupChat.findOne({ groupName });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if the member is already in the group
    if (group.groupMembers.includes(memberName)) {
      return res.status(400).json({ error: 'Member already in the group' });
    }

    const user = await User.findOne({ email: memberName });

    if (!user) {
      return res.status(400).json({ error: 'User not found. Please sign in.' });
    }

    group.groupMembers.push(memberName);
    await group.save();

    return res.status(200).json({ message: 'Member added successfully', group });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/sendMessage', async (req, res) => {
  const { groupName, sender, text } = req.body;

  try {
    const groupChat = await GroupChat.findOne({ groupName });

    if (!groupChat) {
      return res.status(404).json({ error: 'Group not found' });
    }

    groupChat.messages.push({ sender, text });
    await groupChat.save();

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/getMessages', async (req, res) => {
  const { groupName } = req.query;

  try {
    const groupChat = await GroupChat.findOne({ groupName });

    if (!groupChat) {
      return res.status(404).json({ error: 'Group not found' });
    }

    return res.status(200).json({ messages: groupChat.messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});



app.post('/api/createPrivateChat', async (req, res) => {
  const chatDetails = req.body;

  chatDetails.groupMembers = chatDetails.groupMembers.split(',').map(member => member.trim());

  try {
    const newChat = await privateC.create(chatDetails); // Use the GroupChat model
    await newChat.save();
    res.status(201).json(newChat);
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/api/privatechats', async (req, res) => {
  try {
    const chats = await privateC.find(); // Use the GroupChat model
    res.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/api/checkMembers', async (req, res) => {
  const { groupMembers } = req.body;

  try {
    const existingUsers = await User.find({ email: { $in: groupMembers } });

    const existingEmails = existingUsers.map((User) => User.email);

    if (existingEmails.length === groupMembers.length) {
      // All users exist
      res.json({ allUsersExist: true });
    } else {
      // Some users do not exist
      const nonExistingUsers = groupMembers.filter((email) => !existingEmails.includes(email)).join(', ');
      res.status(400).json({ allUsersExist: false, nonExistingUsers });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/chatnames', async (req, res) => {
  try{
    const groupNames = await privateC.find({}, 'groupName');
    res.json({ groupNames });
  }catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/api/addUser', async (req, res) => {
  const { groupName, memberName } = req.body;

  try {
    const group = await privateC.findOne({ groupName });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if the member is already in the group
    if (group.groupMembers.includes(memberName)) {
      return res.status(400).json({ error: 'Member already in the group' });
    }

    const user = await User.findOne({ email: memberName });

    if (!user) {
      return res.status(400).json({ error: 'User not found. Please sign in.' });
    }

    group.groupMembers.push(memberName);
    await group.save();

    return res.status(200).json({ message: 'Member added successfully', group });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/sendMessages', async (req, res) => {
  const { groupName, sender, text } = req.body;

  try {
    const Chat = await privateC.findOne({ groupName });

    if (!Chat) {
      return res.status(404).json({ error: 'Group not found' });
    }

    Chat.messages.push({ sender, text });
    await Chat.save();

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/getMessage', async (req, res) => {
  const { groupName } = req.query;

  try {
    const groupChat = await privateC.findOne({ groupName });

    if (!groupChat) {
      return res.status(404).json({ error: 'Group not found' });
    }

    return res.status(200).json({ messages: groupChat.messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


const PORT= process.env.PORT
app.listen(PORT,()=>{
    console.log(`Server Running on the PORT ${PORT}`)
})

const DB_URL = process.env.DB_URL
mongoose.connect(DB_URL,{useNewUrlParser: true,useUnifiedTopology: true}).then(()=>{
    console.log("MongoDB database connected")
}).catch((error)=>{
    console.log(error)
})