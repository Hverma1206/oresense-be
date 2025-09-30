// src/index.js

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import express, { json } from 'express';
import cors from 'cors';
import lcaRoutes from './routes/lcaRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
dotenv.config(); 

const app = express();
const PORT = process.env.PORT || 8000; 

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('mongoDB connection successful'))
  .catch((err) => console.error(' mongoDB connection error:', err));

app.use(cors());
app.use(json());


app.get('/', (req, res) => {
    res.send('Welcome to CircuMetal AI Backend! API endpoints are at /api/lca');
});


app.use('/api/lca', lcaRoutes); 
app.use('/api/auth', authRoutes); 
app.use('/api/users', userRoutes); 
app.use('/api/team', teamRoutes); // Add team management routes

// Add new endpoint for calculating insights from reports
app.get('/api/lca/insights', (req, res) => {
    try {
        // Here we would typically query the database
        // For demo purposes, we'll return sample data
        const { timeRange, metric } = req.query;
        
        const insights = {
            timeRange,
            metric,
            impactData: [
                {
                    category: 'Carbon Footprint',
                    value: 2.3,
                    unit: 'kg CO₂-eq',
                    trend: 'down',
                    change: -15,
                    status: 'good',
                    benchmark: 3.2
                },
                {
                    category: 'Water Usage',
                    value: 14.7,
                    unit: 'L/kg',
                    trend: 'up',
                    change: 6,
                    status: 'warning',
                    benchmark: 12.0
                },
                {
                    category: 'Energy Consumption',
                    value: 44.2,
                    unit: 'MJ/kg',
                    trend: 'down',
                    change: -8,
                    status: 'good',
                    benchmark: 48.0
                },
                {
                    category: 'Land Use',
                    value: 0.07,
                    unit: 'm²/kg',
                    trend: 'down',
                    change: -12,
                    status: 'good',
                    benchmark: 0.08
                }
            ],
            monthlyTrends: [
                { month: 'Jan', carbonFootprint: 2.8, waterUsage: 14.5, energyConsumption: 48.2 },
                { month: 'Feb', carbonFootprint: 2.7, waterUsage: 14.8, energyConsumption: 47.5 },
                { month: 'Mar', carbonFootprint: 2.6, waterUsage: 15.1, energyConsumption: 46.8 },
                { month: 'Apr', carbonFootprint: 2.5, waterUsage: 15.2, energyConsumption: 45.8 },
                { month: 'May', carbonFootprint: 2.4, waterUsage: 15.0, energyConsumption: 45.2 },
                { month: 'Jun', carbonFootprint: 2.3, waterUsage: 14.7, energyConsumption: 44.2 }
            ],
            processBreakdown: [
                { name: 'Mining', value: 42, color: '#8884d8' },
                { name: 'Processing', value: 33, color: '#82ca9d' },
                { name: 'Transportation', value: 15, color: '#ffc658' },
                { name: 'Packaging', value: 10, color: '#ff7300' }
            ]
        };
        
        res.json(insights);
    } catch (error) {
        console.error('Error calculating insights:', error);
        res.status(500).json({ error: 'Failed to calculate insights' });
    }
});

// Add endpoint for calculating statistics from selected reports
app.post('/api/lca/statistics', (req, res) => {
    try {
        const { reportIds } = req.body;
        
        // Here we would query the database for these specific reports
        // For demo purposes, we'll return sample data
        
        const statistics = {
            reportCount: reportIds.length,
            averages: {
                carbonFootprint: 2.4,
                waterUsage: 14.9,
                energyConsumption: 46.5,
                landUse: 0.075
            },
            trends: {
                carbonFootprint: -8.5,
                waterUsage: 3.2,
                energyConsumption: -5.1,
                landUse: -4.0
            },
            benchmarks: {
                carbonFootprint: 3.2,
                waterUsage: 12.0,
                energyConsumption: 48.0,
                landUse: 0.08
            }
        };
        
        res.json(statistics);
    } catch (error) {
        console.error('Error calculating statistics:', error);
        res.status(500).json({ error: 'Failed to calculate statistics' });
    }
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});


app.listen(PORT, () => {
    console.log(`CircuMetal AI Backend server running on http://localhost:${PORT}`);
    console.log(`Explore API at http://localhost:${PORT}/api/lca`);
    console.log(`Auth endpoints available at http://localhost:${PORT}/api/auth`);
    console.log(`User endpoints available at http://localhost:${PORT}/api/users`);
    console.log(`Team management endpoints available at http://localhost:${PORT}/api/team`);
    console.log(`Impact insights available at http://localhost:${PORT}/api/lca/insights`);
});