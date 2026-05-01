import React, { useState, useEffect } from 'react';
import axios from 'axios'; // API එකට කතා කරන්න ලේසිම ලයිබ්‍රරි එක

const ProfileUpdate = () => {
    // 1. මේක තමයි අපේ දත්ත "බෑග්" එක
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        department: '',
        soundNotify: true,
        emailNotify: true
    });

    // 2. දැනට තියෙන විස්තර ටික ලෝඩ් කරගන්න (GET /users/me)
    useEffect(() => {
        axios.get('/api/users/me')
            .then(res => setFormData(res.data))
            .catch(err => console.log("විස්තර ලෝඩ් කරන්න බැරි වුණා", err));
    }, []);

    // 3. පෙට්ටි වල යමක් ටයිප් කරනකොට ඒක state එකට දාගන්න
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    // 4. "Save" බටන් එක එබුවම Backend එකට යවන විදිහ
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.put('/api/users/me', formData); // අපි හදපු Backend Endpoint එක
            alert("ප්‍රොෆයිල් එක සාර්ථකව වෙනස් වුණා!");
        } catch (err) {
            alert("වෙනස් කරන්න බැරි වුණා. ආයෙත් උත්සාහ කරන්න.");
        }
    };

    return (
        <div className="profile-container">
            <h2>Update My Profile</h2>
            <form onSubmit={handleSubmit}>
                <label>නම:</label>
                <input name="name" value={formData.name} onChange={handleChange} />

                <label>දුරකථනය:</label>
                <input name="phone" value={formData.phone} onChange={handleChange} />

                <label>අංශය (Department):</label>
                <input name="department" value={formData.department} onChange={handleChange} />

                <div>
                    <input type="checkbox" name="soundNotify" checked={formData.soundNotify} onChange={handleChange} />
                    <label>Sound Notifications</label>
                </div>

                <button type="submit">Save Changes</button>
            </form>
        </div>
    );
};

export default ProfileUpdate;