import torch

print("CUDA disponible:", torch.cuda.is_available())
if torch.cuda.is_available():
    print("GPU detectada:", torch.cuda.get_device_name(0))
    print("Versión CUDA usada por PyTorch:", torch.version.cuda)
