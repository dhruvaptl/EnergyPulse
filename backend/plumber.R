#* @apiTitle EnergyPulse R Machine Learning API
#* @apiDescription Backend API for the EnergyPulse campus energy intelligence prototype

library(plumber)
library(jsonlite)


source("predict.R")

#* Enable CORS for local frontend development
#* @filter cors
function(req, res) {
  res$setHeader("Access-Control-Allow-Origin", "*")
  res$setHeader("Access-Control-Allow-Headers", "Content-Type")
  res$setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  if (req$REQUEST_METHOD == "OPTIONS") {
    res$status <- 200
    return("")
  }
  plumber::forward()
}

#* Health check
#* @get /health
function() {
  list(
    status = "ok",
    service = "EnergyPulse R API",
    message = "Backend is running"
  )
}

#* Model information
#* @get /model-info
function() {
  list(
    model_name = "Decision Tree Regression",
    model_file = MODEL_FILE,
    model_available = file.exists(MODEL_FILE),
    purpose = "Energy consumption prediction",
    note = "Predictions require feature names compatible with the saved R model."
  )
}

#* Reference model metrics
#* @get /metrics
function() {
  list(
    selected_model = "Decision Tree",
    linear_regression = list(
      RMSE = 97.91434,
      MAE = 54.96315,
      R2 = 0.1501768
    ),
    decision_tree = list(
      RMSE = 93.74256,
      MAE = 47.40945,
      R2 = 0.2210501
    ),
    interpretation = "The Decision Tree has the lower reference RMSE."
  )
}

#* Generate a prediction using the saved R model
#* @post /predict
#* @serializer json
function(req, res) {
  body <- tryCatch(
    jsonlite::fromJSON(req$postBody, simplifyVector = FALSE),
    error = function(e) NULL
  )

  if (is.null(body) || is.null(body$data)) {
    res$status <- 400
    return(list(
      status = "error",
      message = "Send JSON in the format: { data: { feature: value } }"
    ))
  }

  result <- predict_energy(body$data)

  if (!is.null(result$error)) {
    res$status <- 400
  }

  result
}
