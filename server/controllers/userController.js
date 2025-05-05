const User = require('../models/User');

/**
 * Create or update user in the database
 * @route POST /api/users
 */
const createUser = async (req, res) => {
  try {
    // Firebase user data is available in req.user
    const { uid, email, name, picture } = req.user;
    
    // Check if user already exists
    let user = await User.findOne({ uid });
    
    if (user) {
      // Update existing user
      user.displayName = name || user.displayName;
      user.email = email || user.email;
      user.photoURL = picture || user.photoURL;
      
      const updatedUser = await user.save();
      return res.json(updatedUser);
    }
    
    // Create new user
    const newUser = new User({
      uid,
      displayName: name || 'Usuario',
      email,
      photoURL: picture || ''
    });
    
    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (error) {
    console.error('Error creating/updating user:', error);
    res.status(500).json({ message: 'Error al crear/actualizar usuario' });
  }
};

/**
 * Get user profile
 * @route GET /api/users/profile
 */
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid });
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ message: 'Error al obtener perfil de usuario' });
  }
};

/**
 * Update user profile
 * @route PUT /api/users/profile
 */
const updateUserProfile = async (req, res) => {
  try {
    const { displayName, photoURL } = req.body;
    
    const user = await User.findOne({ uid: req.user.uid });
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Update fields
    if (displayName) user.displayName = displayName;
    if (photoURL) user.photoURL = photoURL;
    
    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Error al actualizar perfil de usuario' });
  }
};

module.exports = {
  createUser,
  getUserProfile,
  updateUserProfile
};
