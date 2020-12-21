from typing import List
import ctypes
import sys
import math

_estimator_so = ctypes.cdll.LoadLibrary('./score_estimator.so')

# Color.h
EMPTY = 0
BLACK = 1
WHITE = -1

def estimate(width, height, data, player_to_move, trials, tolerance):
  """Estimate the score and area using the OGS score estimator.

  The `data` argument must be a `height` * `width` iterable indicating
  where player stones are.

  Return value is the difference between black score and white score
  (positive means back has more on the board).

  The `data` argument is modified in-place and will indicate the player
  that the position.
  """
  arr = ((width * height) * ctypes.c_int)()
  for i, v in enumerate(data):
    arr[i] = v
  score = _estimator_so.estimate(
      width, height, arr, player_to_move, trials,
      ctypes.c_float(tolerance)
  )
  data[:] = arr
  return score
estimate.__annotations__ = {
    'width': int, 'height': int, 'data': List[int], 'player_to_move': int,
    'trials': int, 'tolerance': float, 'return': int,
}

args = sys.argv[1:]

a = [int(x) for x in args[0].split(',')]

score = estimate(int(math.sqrt(len(a))), int(math.sqrt(len(a))), a, int(args[1]), 1000, 0.4)
print(score)
