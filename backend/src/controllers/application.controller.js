import { Application } from '../models/Application.js';

export async function getApplications(req, res) {
  try {
    const apps = await Application.find({ userId: req.userId }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: { applications: apps } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch applications' });
  }
}

export async function getApplicationById(req, res) {
  try {
    const app = await Application.findOne({ _id: req.params.id, userId: req.userId }).lean();
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    res.json({ success: true, data: { application: app } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch application' });
  }
}
