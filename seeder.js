const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('./models/User');
const Category = require('./models/Category');
const Event = require('./models/Event');

mongoose.connect(process.env.MONGO_URI);

const importData = async () => {
  try {
    // clear existing collections
    await User.deleteMany();
    await Category.deleteMany();
    await Event.deleteMany();

    // admin user
    const adminPassword = await bcrypt.hash('Admin@123456', 10);
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@eventpulse.com',
      password: adminPassword,
      role: 'admin',
    });

    // sample categories
    const categories = await Category.insertMany([
      { name: 'Technology', description: 'Tech conferences & workshops' },
      { name: 'Music', description: 'Live concerts & festivals' },
      { name: 'Sports', description: 'Tournaments & fitness events' },
    ]);

    // sample events
    await Event.insertMany([
      {
        title: 'Global Tech Summit 2026',
        description: 'Explore the future of backend development and AI systems.',
        city: 'Cairo',
        date: new Date('2026-11-15T09:00:00Z'),
        capacity: 150,
        category: categories[0]._id,
        createdBy: admin._id,
      },
      {
        title: 'Indie Rock Night',
        description: 'An evening featuring live performances by emerging indie bands.',
        city: 'Alexandria',
        date: new Date('2026-10-20T19:00:00Z'),
        capacity: 80,
        category: categories[1]._id,
        createdBy: admin._id,
      },
    ]);

    console.log('Data successfully seeded!');
    process.exit();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await User.deleteMany();
    await Category.deleteMany();
    await Event.deleteMany();
    console.log('Data cleared!');
    process.exit();
  } catch (error) {
    console.error('Error clearing data:', error);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}