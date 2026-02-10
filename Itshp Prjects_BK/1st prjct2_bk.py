import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots

df = pd.read_csv('customers_dataset.csv')
df_clean = df.assign(channel=df['channel'].str.split(',')).explode('channel')
df_clean['channel'] = df_clean['channel'].str.strip()

#Dashboard layout
fig = make_subplots(
    rows=2, cols=2,
    subplot_titles=("Gender analysis", "Digital Channel Adoption", "Distribution by District"),
    specs=[[{"type": "domain"}, {"type": "xy"}], 
           [{"type": "xy"}, None]],
    vertical_spacing=0.15,
    horizontal_spacing=0.1
)

#Graphic 1
fig.add_trace(go.Pie(
    labels=df['gender'], 
    hole=0.4,
    marker=dict(colors=['royalblue', 'tomato'])
), row=1, col=1)

#Graphic 2: Digital Channel Adoption (Histogram)
counts = df_clean['channel'].value_counts()
#Colors for the bars
colors = ['mediumspringgreen', 'tomato', 'royalblue'] 

fig.add_trace(go.Bar(
    x=counts.index, 
    y=counts.values,
    marker_color=['royalblue', 'tomato', 'mediumspringgreen'], 
    showlegend=False
), row=1, col=2)

#Graphic 3
addr_counts = df['address'].value_counts()
fig.add_trace(go.Bar(
    x=addr_counts.index, 
    y=addr_counts.values,
    marker_color='royalblue',
    showlegend=False
), row=2, col=1)

# Overall layout adjustments
fig.update_layout(
    height=700, 
    width=1100,
    title_text="Customer Demographics and Channel Adoption Dashboard",
    title_x=0.5, 
    template="plotly_white" 
)

# Adjust x-axis for better readability
fig.update_xaxes(tickangle=45, row=2, col=1)

fig.show()