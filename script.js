async function predict() {
    const resultDiv = document.getElementById("result");
    const btn = document.querySelector("button");

    const price = document.getElementById("price").value;

    // --- проверка цены ---
    if (!price) {
        resultDiv.className = "result error";
        resultDiv.innerHTML = "Введите цену";
        resultDiv.style.display = "block";
        return;
    }

    // --- проверка industry ---
    const industryInput = document.getElementById("industry");
    const options = document.querySelectorAll("#industry_list option");

    const validValues = Array.from(options).map(o => o.value);

    if (industryInput.value && !validValues.includes(industryInput.value)) {
        resultDiv.className = "result error";
        resultDiv.innerHTML = "Выберите значение из списка";
        resultDiv.style.display = "block";
        return;
    }

    // --- дата ---
    const datetime =
    document.getElementById("publication_datetime").value;

    const applicationsDeadlineDatetime =
        document.getElementById("applications_deadline_datetime").value;
    
    const applicationsStartDatetime =
        document.getElementById("applications_start_datetime").value;
    
    const tradingEndDatetime =
        document.getElementById("trading_end_datetime").value;

    // --- собираем данные ---
    const data = {
        customer_price_rub: parseFloat(price),
        delivery_region: document.getElementById("region").value,
        trade_type: document.getElementById("trade").value,
        electronic_trade_mode: document.getElementById("mode").value || null,
        trading_platform: document.getElementById("platform").value || null,
        industry_scope: industryInput.value || null,
        publication_datetime: datetime || null,

        // чекбоксы
        has_purchase_code: document.getElementById("has_purchase_code").checked ? 1 : 0,
        national_regime_flag: document.getElementById("national_regime_flag").checked ? 1 : 0,

        delivery_city: document.getElementById("delivery_city").value || null,
        
        publication_name: document.getElementById("publication_name").value || null,
        
        bid_security_rub: parseFloat(document.getElementById("bid_security_rub").value) || 0,
        
        bid_security_pct: parseFloat(document.getElementById("bid_security_pct").value) || 0,
        
        contract_security_rub: parseFloat(document.getElementById("contract_security_rub").value) || 0,
        
        contract_security_pct: parseFloat(document.getElementById("contract_security_pct").value) || 0,
        
        bank_treasury_support: document.getElementById("bank_treasury_support").value || null,
        
        num_participants: parseInt(document.getElementById("num_participants").value) || 0,
        
        applications_deadline_datetime: applicationsDeadlineDatetime || null,
        
        applications_start_datetime: applicationsStartDatetime || null,
        
        trading_end_datetime: tradingEndDatetime || null,
    };

    try {
        btn.disabled = true;

        resultDiv.className = "result";
        resultDiv.innerHTML = "⏳ Считаем...";
        resultDiv.style.display = "block";

        const response = await fetch("https://project-2026-ekaterina-moroz.amvera.io/predict", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const res = await response.json();

        if (res.error) {
            resultDiv.className = "result error";
            resultDiv.innerHTML = "Ошибка: " + res.error;
        } else {
            const drop = res.predicted_drop_pct * 100;

            let interpretation = "";

            if (drop > 25) {
                interpretation = "⚠️ Прогнозируется значительное снижение цены. Рекомендуется обратить внимание: это может быть признаком агрессивного демпинга.";
            } else {
                interpretation = "✅ Ожидаемое снижение находится в умеренном диапазоне и соответствует типичной динамике торгов.";
            }

            resultDiv.className = "result";
            resultDiv.innerHTML = `
                🔻 Снижение: ${drop.toFixed(2)}% <br>
                💰 Итоговая цена: ${res.predicted_final_price.toLocaleString("ru-RU")} ₽ <br><br>
                ${interpretation}
            `;
        }

    } catch (err) {
        resultDiv.className = "result error";
        resultDiv.innerHTML = "Ошибка запроса: " + err;
    } finally {
        btn.disabled = false;
    }
}
