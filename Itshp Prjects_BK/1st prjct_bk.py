import pandas as pd
import plotly.express as px

df = pd.read_csv('customers_dataset.csv')
df_clean = df.assign(channel=df['channel'].str.split(',')).explode('channel')
df_clean['channel'] = df_clean['channel'].str.strip()
#Demographic Graphic (gender)
#pie chart)
fig_gender = px.pie(df, names='gender', title='Demographic Analysis : Gender', hole=0.3)
fig_gender.show()

#Digital Channel Adoption Graphic
#customers using digital channels
fig_channel = px.histogram(df_clean, x='channel', title='Digital Channel Adoption', color='channel', category_orders={"channel": ["Internet Banking", "Mobile Banking", "USSD"]})
fig_channel.show()

#Geographical Distribution Graphic
fig_address = px.histogram(df, x='address', title='Customer distribution by District').update_xaxes(categoryorder="total descending")
fig_address.show()
