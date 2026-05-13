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

        // --- запрос прогноза цены ---
        const priceResponse = await fetch(
            "https://project-2026-ekaterina-moroz.amvera.io/predict",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            }
        );
        
        const priceRes = await priceResponse.json();
        
        // --- запрос прогноза демпинга ---
        const dumpingResponse = await fetch(
            "https://project-2026-ekaterina-moroz.amvera.io/predict_dumping",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            }
        );
        
        const dumpingRes = await dumpingResponse.json();
        
        // --- ошибки ---
        if (priceRes.error) {
            resultDiv.className = "result error";
            resultDiv.innerHTML = "Ошибка: " + priceRes.error;
            return;
        }
        
        if (dumpingRes.error) {
            resultDiv.className = "result error";
            resultDiv.innerHTML = "Ошибка: " + dumpingRes.error;
            return;
        }
        
        // --- результаты ---
        const drop = priceRes.predicted_drop_pct * 100;
        
        const isDumping = dumpingRes.is_dumping;
        
        let dumpingText = "";
        
        if (isDumping) {
            dumpingText =
                "⚠️ Модель выявила высокий риск демпинга. Рекомендуется обратить внимание.";
        } else {
            dumpingText =
                "✅ Признаков аномального демпинга не обнаружено.";
        }
        
resultDiv.className = "result-card";

resultDiv.innerHTML = `
    <div class="result-title">
        Прогноз и оценка
    </div>

    <div class="result-grid">

        <!-- DROP -->
        <div class="metric-card">

            <div class="metric-header">

                <div class="metric-icon danger">
                    ▼
                </div>

                <div class="metric-name">
                    Снижение цены
                </div>

            </div>

            <div class="metric-value">
                ${drop.toFixed(2)}%
            </div>

            <div class="metric-description">
                Ожидаемое снижение
            </div>

        </div>

        <!-- PRICE -->
        <div class="metric-card">

            <div class="metric-header">

                <div class="metric-icon success">
                    ₽
                </div>

                <div class="metric-name">
                    Итоговая цена
                </div>

            </div>

            <div class="metric-value">
                ${priceRes.predicted_final_price.toLocaleString("ru-RU")} ₽
            </div>

            <div class="metric-description">
                Прогнозируемая итоговая цена
            </div>

        </div>

        <!-- DUMPING -->
        <div class="metric-card">

            <div class="metric-header">

                <div class="metric-icon info">
                    ✓
                </div>

                <div class="metric-name">
                    Признак демпинга
                </div>

            </div>

            <div class="metric-value">
                ${isDumping ? "Обнаружен" : "Не обнаружено"}
            </div>

            <div class="metric-description">
                ${
                    isDumping
                    ? "Есть признаки аномального снижения цены"
                    : "Аномального демпинга не выявлено"
                }
            </div>

        </div>

    </div>

    <div class="result-footer">
        Прогноз построен на основе исторических данных
        о торгах и рыночных факторов.
    </div>
`;

    } catch (err) {
        resultDiv.className = "result error";
        resultDiv.innerHTML = "Ошибка запроса: " + err;
    } finally {
        btn.disabled = false;
    }
}
