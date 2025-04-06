import express from 'express';
import { ChainOfDraftClient } from './client';
import { AnalyticsService } from './analytics';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());
const client = new ChainOfDraftClient();
const analytics = new AnalyticsService();

app.post('/v1/completions', async (req, res) => {
  try {
    const { model, prompt, ...options } = req.body;
    const result = await client.completions(model, prompt, options);
    res.json(result);
  } catch (error) {
    logger.error('Error in completions:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.post('/v1/chat/completions', async (req, res) => {
  try {
    const { model, messages, ...options } = req.body;
    const result = await client.chat(model, messages, options);
    res.json(result);
  } catch (error) {
    logger.error('Error in chat:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.get('/v1/models', async (req, res) => {
  try {
    const models = await client.getAvailableModels();
    res.json({ data: models.map(id => ({ id })) });
  } catch (error) {
    logger.error('Error getting models:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.get('/v1/analytics/performance', async (req, res) => {
  try {
    const { domain } = req.query;
    const stats = await analytics.getPerformanceByDomain(domain as string);
    res.json({ data: stats });
  } catch (error) {
    logger.error('Error getting performance stats:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.get('/v1/analytics/token-reduction', async (req, res) => {
  try {
    const stats = await analytics.getTokenReductionStats();
    res.json({ data: stats });
  } catch (error) {
    logger.error('Error getting token reduction stats:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.get('/v1/analytics/accuracy', async (req, res) => {
  try {
    const stats = await analytics.getAccuracyComparison();
    res.json({ data: stats });
  } catch (error) {
    logger.error('Error getting accuracy stats:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.listen(port, () => {
  logger.success(`Server running at http://localhost:${port}`);
});
