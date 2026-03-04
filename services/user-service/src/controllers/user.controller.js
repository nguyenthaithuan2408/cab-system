import { userRepository } from '../repositories/user.repository.js';

class UserController {
    async getUserProfile(req, res) {
        const userId = req.header('x-user-id'); // To be replaced by auth middleware
        if (!userId) {
            return res.status(400).json({ error: 'x-user-id header is required' });
        }

        try {
            const user = await userRepository.findById(req.db, userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            return res.json(user);
        } catch (err) {
            console.error('Error fetching profile', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async updateUserProfile(req, res) {
        const userId = req.header('x-user-id'); // To be replaced by auth middleware
        if (!userId) {
            return res.status(400).json({ error: 'x-user-id header is required' });
        }

        const { name, phone } = req.body || {};
        if (!name && !phone) {
            return res.status(400).json({ error: 'At least one of name or phone must be provided' });
        }

        try {
            const updatedUser = await userRepository.update(req.db, userId, { name, phone });
            if (!updatedUser) {
                return res.status(404).json({ error: 'User not found' });
            }
            return res.json(updatedUser);
        } catch (err) {
            console.error('Error updating profile', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getUserById(req, res) {
        const { id } = req.params;
        try {
            const user = await userRepository.findPublicById(req.db, id);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            return res.json(user);
        } catch (err) {
            console.error('Error fetching user', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // We will add register, login controllers here later
}

export const userController = new UserController();