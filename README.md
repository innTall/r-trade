# Vue 3 + Vite

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).

Algorithm data:
src/composables/useTradeCalc.js
Add a calculation algorithm for long positions:
- text input (for symbols)
- L1 - round(a4/(L6-L7),3) - Active
- L2 - round(L1*L6,1) - Sum
- L3 - round(1/(1-L6/L7)*-1,0) - max Lever
- L4 - int input - Lever for math
- L5 - round((L6/(a5/(L6-L7)))/L3,1) - margin, $
- L6 - buy price, $
- L7 - SL price, $
- L8 - .... - TP1 price, $
- L9 - .... - TP2 price, $
- L10 - Profit, $
- L11 - RR, %
- L12 - TP1, %
- L13 - TP2, %
- L14 - SL, %
Add a calculation algorithm for Short positions:
- text input (for symbols)
- S1 - round(a4/(S7-S6),3) - Active
- S2 - round(S1*S6,1) - Sum
- S3 - round(1/(1-S7/S6)*-1,0) - max Lever
- S4 - int input - Lever for math
- S5 - round((S6/(a5/(S7-S6)))/S4,1) - margin, $
- S6 - sell price, $
- S7 - SL price, $
- S8 - .... - TP1 price, $
- S9 - .... - TP2 price, $
- S10 - Profit, $
- S11 - RR, %
- S12 - TP1, %
- S13 - TP2, %
- S14 - SL, %