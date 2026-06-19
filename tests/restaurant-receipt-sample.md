# Restaurant Receipt Sample Case

Use this sample to validate restaurant-bill behavior manually or in future automated tests.

## Input Items

Paneer Tikka, Hara Bhara Kebab, Chicken 65, Tomato Soup, Manchow Soup,
Paneer Butter Masala, Dal Makhani, Butter Chicken, Kadai Veg, Butter Naan,
Garlic Naan, Tandoori Roti, Laccha Paratha, Jeera Rice, Steam Rice,
Chicken Biryani, Veg Biryani, Gulab Jamun, Rasmalai, Sweet Lassi,
Masala Chaas, Lime Soda.

## Expected Behavior

- `receiptType` is `restaurant_bill`.
- Protein sources include paneer, dal, and chicken dishes.
- `healthScore` is greater than `0`.
- `healthScore` does not exceed `75` because the bill includes desserts, soda,
  butter-heavy curries, fried starters, biryani, naan, paratha, and rice.
- Output includes practical suggestions such as reducing sweet drinks/desserts,
  choosing fewer naan/paratha portions, keeping protein anchors, and adding
  salad/curd/chaas or vegetables.

