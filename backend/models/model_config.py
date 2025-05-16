import torch
import torch.nn as nn


class SimpleAttention(nn.Module):
    def __init__(self):
        super().__init__()

    def forward(self, query, value):
        # query, value shape: (batch, seq_len, hidden_dim)
        scores = torch.matmul(query, value.transpose(1, 2))  # (batch, seq_len, seq_len)
        weights = torch.nn.functional.softmax(scores, dim=-1)
        context = torch.matmul(weights, value)  # (batch, seq_len, hidden_dim)
        return context


class BiLSTMAttnModel(nn.Module):
    def __init__(self, vocab_size, embedding_dim, hidden_dim, num_classes):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embedding_dim)
        self.bilstm = nn.LSTM(embedding_dim, hidden_dim, batch_first=True, bidirectional=True)
        self.attn = SimpleAttention()
        self.pool = nn.AdaptiveAvgPool1d(1)
        self.linear1 = nn.Linear(hidden_dim * 2, 128)
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(0.3)
        self.fc = nn.Linear(128, num_classes)

    def forward(self, x):
        x = self.embedding(x)  # (B, 50, emb_dim)
        x, _ = self.bilstm(x)  # (B, 50, 256)
        x = self.attn(x, x)  # (B, 50, 256)
        x = torch.mean(x, dim=1)  # (B, 256)
        x = self.linear1(x)  # (B, 128)
        x = self.relu(x)
        x = self.dropout(x)
        return self.fc(x)  # (B, num_classes)
