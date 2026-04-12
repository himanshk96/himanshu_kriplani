import Foundation
import UIKit
import CoreML
import Vision
import Accelerate

/**
 Native module for iOS that handles:
 1. Loading Gemma CoreML model with Neural Engine acceleration
 2. Running body segmentation via Vision framework
 3. Texture extraction and mapping
 4. Image compositing for virtual try-on
 */
@objc(TryOnModule)
class TryOnModule: NSObject {

  private var gemmaModel: MLModel?
  private var segmentationModel: MLModel?
  private var segmentationRequest: VNCoreMLRequest?

  /// Initialize both models with CoreML/Neural Engine acceleration.
  @objc
  func initializeModels(_ gemmaPath: String, segPath: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .userInitiated).async {
      do {
        // Load Gemma CoreML model
        let gemmaURL = URL(fileURLWithPath: gemmaPath)
        let gemmaConfig = MLModelConfiguration()
        gemmaConfig.computeUnits = .all // Use Neural Engine + GPU + CPU
        self.gemmaModel = try MLModel(contentsOf: gemmaURL, configuration: gemmaConfig)

        // Load segmentation model
        let segURL = URL(fileURLWithPath: segPath)
        let segConfig = MLModelConfiguration()
        segConfig.computeUnits = .all
        self.segmentationModel = try MLModel(contentsOf: segURL, configuration: segConfig)

        // Set up Vision request for segmentation
        let vnModel = try VNCoreMLModel(for: self.segmentationModel!)
        self.segmentationRequest = VNCoreMLRequest(model: vnModel)
        self.segmentationRequest?.imageCropAndScaleOption = .scaleFill

        DispatchQueue.main.async {
          resolve(true)
        }
      } catch {
        DispatchQueue.main.async {
          reject("MODEL_INIT_ERROR", "Failed to initialize models: \(error.localizedDescription)", error)
        }
      }
    }
  }

  /// Run body segmentation to detect the upper body / torso region.
  @objc
  func segmentUpperBody(_ imagePath: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .userInitiated).async {
      guard let image = UIImage(contentsOfFile: imagePath),
            let cgImage = image.cgImage else {
        reject("SEGMENTATION_ERROR", "Failed to load image", nil)
        return
      }

      guard let request = self.segmentationRequest else {
        reject("SEGMENTATION_ERROR", "Model not initialized", nil)
        return
      }

      let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
      do {
        try handler.perform([request])

        guard let results = request.results as? [VNCoreMLFeatureValueObservation],
              let multiArray = results.first?.featureValue.multiArrayValue else {
          reject("SEGMENTATION_ERROR", "No segmentation results", nil)
          return
        }

        // Process segmentation mask
        let width = Int(image.size.width)
        let height = Int(image.size.height)
        let maskImage = self.createMaskFromMultiArray(multiArray, width: width, height: height)

        // Calculate bounds of the upper body region
        let bounds = self.calculateMaskBounds(multiArray, imageWidth: width, imageHeight: height)

        // Save mask to cache
        let maskPath = self.saveTempImage(maskImage, prefix: "segmentation_mask")

        let result: [String: Any] = [
          "maskPath": maskPath,
          "bounds": bounds
        ]

        DispatchQueue.main.async {
          resolve(result)
        }
      } catch {
        reject("SEGMENTATION_ERROR", "Segmentation failed: \(error.localizedDescription)", error)
      }
    }
  }

  /// Extract texture from clothing material photo.
  @objc
  func extractTexture(_ clothingImagePath: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard let image = UIImage(contentsOfFile: clothingImagePath) else {
      reject("TEXTURE_ERROR", "Failed to load clothing image", nil)
      return
    }

    // Resize to standard texture size
    let textureSize = CGSize(width: 512, height: 512)
    UIGraphicsBeginImageContextWithOptions(textureSize, false, 1.0)
    image.draw(in: CGRect(origin: .zero, size: textureSize))
    let textureImage = UIGraphicsGetImageFromCurrentImageContext()!
    UIGraphicsEndImageContext()

    let texturePath = saveTempImage(textureImage, prefix: "fabric_texture")
    resolve(texturePath)
  }

  /// Run Gemma inference for clothing drape parameters.
  @objc
  func runGemmaInference(_ prompt: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .userInitiated).async {
      do {
        guard let model = self.gemmaModel else {
          // Fallback parameters if model not loaded
          resolve("fold_intensity:0.6,drape_angle:15,taper_ratio:0.85,shadow_depth:0.3")
          return
        }

        // Prepare input for Gemma model
        let inputDescription = model.modelDescription.inputDescriptionsByName
        guard let inputDesc = inputDescription.values.first else {
          resolve("fold_intensity:0.6,drape_angle:15,taper_ratio:0.85,shadow_depth:0.3")
          return
        }

        // Run prediction
        let provider = try MLDictionaryFeatureProvider(dictionary: [
          inputDesc.name: MLFeatureValue(string: prompt)
        ])
        let prediction = try model.prediction(from: provider)

        if let outputValue = prediction.featureValue(for: "output")?.stringValue {
          resolve(outputValue)
        } else {
          resolve("fold_intensity:0.6,drape_angle:15,taper_ratio:0.85,shadow_depth:0.3")
        }
      } catch {
        // Fallback to default parameters
        resolve("fold_intensity:0.6,drape_angle:15,taper_ratio:0.85,shadow_depth:0.3")
      }
    }
  }

  /// Composite the final try-on image.
  @objc
  func compositeImage(_ params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .userInitiated).async {
      guard let personPath = params["personImage"] as? String,
            let maskPath = params["mask"] as? String,
            let texturePath = params["texture"] as? String,
            let outputPath = params["outputPath"] as? String,
            let bounds = params["bounds"] as? [String: Double] else {
        reject("COMPOSITE_ERROR", "Invalid parameters", nil)
        return
      }

      guard let personImage = UIImage(contentsOfFile: personPath),
            let maskImage = UIImage(contentsOfFile: maskPath),
            let textureImage = UIImage(contentsOfFile: texturePath) else {
        reject("COMPOSITE_ERROR", "Failed to load images", nil)
        return
      }

      let size = personImage.size
      let bx = CGFloat(bounds["x"] ?? 0)
      let by = CGFloat(bounds["y"] ?? 0)
      let bw = CGFloat(bounds["width"] ?? 100)
      let bh = CGFloat(bounds["height"] ?? 100)

      UIGraphicsBeginImageContextWithOptions(size, false, 1.0)
      guard let context = UIGraphicsGetCurrentContext() else {
        reject("COMPOSITE_ERROR", "Failed to create graphics context", nil)
        return
      }

      // Draw base person image
      personImage.draw(in: CGRect(origin: .zero, size: size))

      // Create clipping mask from segmentation
      context.saveGState()
      if let maskCG = maskImage.cgImage {
        context.clip(to: CGRect(origin: .zero, size: size), mask: maskCG)
      }

      // Draw scaled texture in the clothing region with blending
      context.setAlpha(0.78)
      textureImage.draw(in: CGRect(x: bx, y: by, width: bw, height: bh))
      context.restoreGState()

      let resultImage = UIGraphicsGetImageFromCurrentImageContext()!
      UIGraphicsEndImageContext()

      // Save result
      if let jpegData = resultImage.jpegData(compressionQuality: 0.92) {
        do {
          try jpegData.write(to: URL(fileURLWithPath: outputPath))
          resolve(outputPath)
        } catch {
          reject("COMPOSITE_ERROR", "Failed to save result: \(error.localizedDescription)", error)
        }
      } else {
        reject("COMPOSITE_ERROR", "Failed to encode result image", nil)
      }
    }
  }

  /// Release model resources.
  @objc
  func releaseModels(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    gemmaModel = nil
    segmentationModel = nil
    segmentationRequest = nil
    resolve(true)
  }

  // MARK: - Helper Methods

  private func createMaskFromMultiArray(_ multiArray: MLMultiArray, width: Int, height: Int) -> UIImage {
    let maskWidth = multiArray.shape[2].intValue
    let maskHeight = multiArray.shape[1].intValue

    UIGraphicsBeginImageContextWithOptions(CGSize(width: width, height: height), false, 1.0)
    let context = UIGraphicsGetCurrentContext()!
    context.setFillColor(UIColor.clear.cgColor)
    context.fill(CGRect(x: 0, y: 0, width: width, height: height))

    let scaleX = CGFloat(width) / CGFloat(maskWidth)
    let scaleY = CGFloat(height) / CGFloat(maskHeight)

    for y in 0..<maskHeight {
      for x in 0..<maskWidth {
        // Class 2 = upper body clothing
        let index = [0, y, x, 2] as [NSNumber]
        let value = multiArray[index].floatValue
        if value > 0.5 {
          context.setFillColor(UIColor.white.cgColor)
          context.fill(CGRect(x: CGFloat(x) * scaleX, y: CGFloat(y) * scaleY, width: scaleX, height: scaleY))
        }
      }
    }

    let image = UIGraphicsGetImageFromCurrentImageContext()!
    UIGraphicsEndImageContext()
    return image
  }

  private func calculateMaskBounds(_ multiArray: MLMultiArray, imageWidth: Int, imageHeight: Int) -> [String: Double] {
    let maskWidth = multiArray.shape[2].intValue
    let maskHeight = multiArray.shape[1].intValue

    var minX = maskWidth, minY = maskHeight, maxX = 0, maxY = 0

    for y in 0..<maskHeight {
      for x in 0..<maskWidth {
        let index = [0, y, x, 2] as [NSNumber]
        let value = multiArray[index].floatValue
        if value > 0.5 {
          minX = min(minX, x)
          minY = min(minY, y)
          maxX = max(maxX, x)
          maxY = max(maxY, y)
        }
      }
    }

    let scaleX = Double(imageWidth) / Double(maskWidth)
    let scaleY = Double(imageHeight) / Double(maskHeight)

    return [
      "x": Double(minX) * scaleX,
      "y": Double(minY) * scaleY,
      "width": Double(maxX - minX) * scaleX,
      "height": Double(maxY - minY) * scaleY
    ]
  }

  private func saveTempImage(_ image: UIImage, prefix: String) -> String {
    let cacheDir = NSSearchPathForDirectoriesInDomains(.cachesDirectory, .userDomainMask, true).first!
    let fileName = "\(prefix)_\(Int(Date().timeIntervalSince1970 * 1000)).png"
    let filePath = (cacheDir as NSString).appendingPathComponent(fileName)
    if let pngData = image.pngData() {
      try? pngData.write(to: URL(fileURLWithPath: filePath))
    }
    return filePath
  }
}
