import mongoose from 'mongoose';

const privateSchema = new mongoose.Schema({
  groupName: { type: String, required: true },
  admin: { type: String, required: true },
  groupMembers: { type: [String], required: true },
  messages: [{
    sender: { type: String, required: true }, // Assuming Sender is the user's email
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  });
  
  const privateC = mongoose.model('privateChat', privateSchema); 

  export default privateC;
  ;