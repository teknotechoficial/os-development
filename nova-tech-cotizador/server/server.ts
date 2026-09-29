import { app } from './index';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`[TeknoTech API] Server running on port ${PORT}`);
});

export default app;
